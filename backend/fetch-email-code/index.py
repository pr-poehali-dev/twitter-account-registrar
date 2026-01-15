import json
import os
import imaplib
import email
from email.header import decode_header
import re
from typing import Optional, Dict

def get_imap_config(email_address: str) -> Optional[Dict[str, any]]:
    '''Определяет IMAP настройки для популярных почтовых сервисов'''
    domain = email_address.split('@')[-1].lower()
    
    imap_servers = {
        'gmail.com': {'host': 'imap.gmail.com', 'port': 993},
        'googlemail.com': {'host': 'imap.gmail.com', 'port': 993},
        'yahoo.com': {'host': 'imap.mail.yahoo.com', 'port': 993},
        'outlook.com': {'host': 'outlook.office365.com', 'port': 993},
        'hotmail.com': {'host': 'outlook.office365.com', 'port': 993},
        'live.com': {'host': 'outlook.office365.com', 'port': 993},
        'gmx.com': {'host': 'imap.gmx.com', 'port': 993},
        'gmx.net': {'host': 'imap.gmx.net', 'port': 993},
        'mail.ru': {'host': 'imap.mail.ru', 'port': 993},
        'yandex.ru': {'host': 'imap.yandex.ru', 'port': 993},
        'yandex.com': {'host': 'imap.yandex.com', 'port': 993},
        'icloud.com': {'host': 'imap.mail.me.com', 'port': 993},
        'me.com': {'host': 'imap.mail.me.com', 'port': 993},
        'aol.com': {'host': 'imap.aol.com', 'port': 993},
        'zoho.com': {'host': 'imap.zoho.com', 'port': 993},
        'protonmail.com': {'host': 'imap.protonmail.com', 'port': 993},
    }
    
    return imap_servers.get(domain)

def extract_code_from_email(body_text: str) -> Optional[str]:
    '''Извлекает код подтверждения из текста письма'''
    patterns = [
        r'verification code[:\s]+(\d{6,8})',
        r'confirmation code[:\s]+(\d{6,8})',
        r'your code[:\s]+(\d{6,8})',
        r'code[:\s]+(\d{6,8})',
        r'\b(\d{6,8})\b',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, body_text, re.IGNORECASE)
        if match:
            return match.group(1)
    
    return None

def handler(event: dict, context) -> dict:
    '''Получает код подтверждения из любого почтового сервиса для верификации Twitter/X аккаунта'''
    
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_str = event.get('body', '{}')
    if not body_str or body_str.strip() == '':
        body_str = '{}'
    
    body = json.loads(body_str)
    email_address = body.get('email', '')
    password = body.get('password', '')
    
    if not email_address or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Email and password required'}),
            'isBase64Encoded': False
        }
    
    imap_config = get_imap_config(email_address)
    
    if not imap_config:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': f'Unsupported email provider: {email_address.split("@")[-1]}',
                'supported': 'Gmail, Yahoo, Outlook, Hotmail, GMX, Mail.ru, Yandex, iCloud, AOL, Zoho, ProtonMail'
            }),
            'isBase64Encoded': False
        }
    
    try:
        mail = imaplib.IMAP4_SSL(imap_config['host'], imap_config['port'])
        mail.login(email_address, password)
        mail.select('INBOX')
        
        status, messages = mail.search(None, '(FROM "verify@twitter.com" OR FROM "info@twitter.com" OR FROM "verify@x.com" OR FROM "info@x.com")')
        
        if status != 'OK' or not messages[0]:
            mail.logout()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'No verification emails found from X/Twitter'}),
                'isBase64Encoded': False
            }
        
        email_ids = messages[0].split()
        latest_email_id = email_ids[-1]
        
        status, msg_data = mail.fetch(latest_email_id, '(RFC822)')
        
        if status != 'OK':
            mail.logout()
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Failed to fetch email'}),
                'isBase64Encoded': False
            }
        
        for response_part in msg_data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                
                subject = msg.get('Subject', '')
                from_addr = msg.get('From', '')
                
                body_text = ''
                if msg.is_multipart():
                    for part in msg.walk():
                        content_type = part.get_content_type()
                        if content_type == 'text/plain' or content_type == 'text/html':
                            try:
                                body_text += part.get_payload(decode=True).decode('utf-8', errors='ignore')
                            except:
                                pass
                else:
                    body_text = msg.get_payload(decode=True).decode('utf-8', errors='ignore')
                
                verification_code = extract_code_from_email(body_text)
                
                if verification_code:
                    mail.logout()
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'code': verification_code,
                            'email': email_address,
                            'subject': subject,
                            'from': from_addr,
                            'success': True
                        }),
                        'isBase64Encoded': False
                    }
        
        mail.logout()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Verification code not found in email'}),
            'isBase64Encoded': False
        }
        
    except imaplib.IMAP4.error as e:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': f'Email authentication failed: {str(e)}',
                'hint': 'For Gmail/Yahoo: use app password instead of regular password'
            }),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Server error: {str(e)}'}),
            'isBase64Encoded': False
        }