/**
 * Email Workers 收件处理
 */

import { parseEmail, Attachment } from './parser'
import { extractVerificationCode } from './verification'

interface Env {
  DB: D1Database
  R2: R2Bucket
  MAIL_DOMAIN: string
}

// 计算文件哈希（用于附件去重）
async function hashContent(content: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', content)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// 生成 R2 存储路径
function generateR2Key(prefix: string, mailbox: string): string {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  const timestamp = now.getTime()
  const uuid = crypto.randomUUID()

  return `${prefix}/${y}/${m}/${d}/${mailbox}/${timestamp}-${uuid}`
}

// 获取文件扩展名
function getExtension(filename: string, contentType: string): string {
  const extMatch = filename.match(/\.([^.]+)$/)
  if (extMatch) return extMatch[1].toLowerCase()

  // 根据 MIME 类型推断
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'application/zip': 'zip',
    'text/plain': 'txt',
  }
  return mimeMap[contentType] || 'bin'
}

// 生成预览文本
function generatePreview(text: string, html: string): string {
  let content = text || html
  // 移除 HTML 标签
  content = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  // 截取前 120 字符
  return content.length > 120 ? content.substring(0, 120) + '...' : content
}

export async function handleEmail(
  message: EmailMessage,
  env: Env
): Promise<void> {
  const toAddress = message.to.toLowerCase()

  // 检查收件邮箱是否存在
  const mailboxRow = await env.DB.prepare('SELECT id FROM mailboxes WHERE address = ?')
    .bind(toAddress)
    .first<{ id: number }>()

  if (!mailboxRow) {
    console.log(`Mailbox not found: ${toAddress}, rejecting`)
    message.setReject('Mailbox not found')
    return
  }

  // 读取原始邮件内容
  const rawEmail = await new Response(message.raw).text()

  // 解析邮件
  const parsed = parseEmail(rawEmail)

  // 提取验证码
  const verificationCode = extractVerificationCode(parsed.subject, parsed.text, parsed.html)

  // 生成预览
  const preview = generatePreview(parsed.text, parsed.html)

  // 存储 EML 到 R2
  const emlKey = generateR2Key('eml', toAddress) + '.eml'
  await env.R2.put(emlKey, rawEmail)

  // 插入邮件记录
  const messageResult = await env.DB.prepare(
    `INSERT INTO messages (mailbox_id, sender, subject, preview, verification_code, r2_key)
     VALUES (?, ?, ?, ?, ?, ?)
     RETURNING id`
  )
    .bind(mailboxRow.id, parsed.from, parsed.subject, preview, verificationCode, emlKey)
    .first<{ id: number }>()

  if (!messageResult) {
    throw new Error('Failed to insert message')
  }

  const messageId = messageResult.id

  // 处理附件（带去重）
  for (const att of parsed.attachments) {
    await saveAttachment(env, messageId, att)
  }

  console.log(`Email saved: ${parsed.subject} (code: ${verificationCode || 'none'})`)
}

// 保存附件（带去重逻辑）
async function saveAttachment(
  env: Env,
  messageId: number,
  attachment: Attachment
): Promise<void> {
  const hash = await hashContent(attachment.content)
  const ext = getExtension(attachment.filename, attachment.contentType)
  const r2Key = `attachments/${hash}.${ext}`

  // 检查是否已存在相同哈希的附件
  const existing = await env.DB.prepare('SELECT id FROM attachments WHERE hash = ?')
    .bind(hash)
    .first()

  // 如果不存在，上传到 R2
  if (!existing) {
    await env.R2.put(r2Key, attachment.content, {
      httpMetadata: { contentType: attachment.contentType },
    })
  }

  // 插入附件记录（即使 R2 文件已存在，也要建立关联）
  await env.DB.prepare(
    `INSERT INTO attachments (message_id, filename, content_type, size, hash, r2_key)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(messageId, attachment.filename, attachment.contentType, attachment.content.length, hash, r2Key)
    .run()
}
