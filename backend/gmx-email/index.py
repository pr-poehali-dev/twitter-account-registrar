import json
import os
import imaplib
import email
from email.header import decode_header
import re
from typing import Optional

def handler(event: dict, context) -> dict:
    '''Получает код подтверждения из GMX почты для верификации Twitter аккаунта'''
    
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
    
    body = json.loads(event.get('body', '{}'))
    email_address = body.get('email', '')
    password = body.get('password', '')
    
    if not email_address or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Email and password required'}),
            'isBase64Encoded': False
        }
    
    try:
        # Подключаемся к GMX IMAP серверу
        mail = imaplib.IMAP4_SSL('imap.gmx.com', 993)
        mail.login(email_address, password)
        mail.select('INBOX')
        
        # Ищем письма от Twitter за последние 5 минут
        status, messages = mail.search(None, '(FROM "verify@twitter.com" OR FROM "info@twitter.com")')
        
        if status != 'OK' or not messages[0]:
            mail.logout()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'No verification emails found'}),
                'isBase64Encoded': False
            }
        
        # Берем последнее письмо
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
        
        # Парсим письмо
        for response_part in msg_data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                
                # Извлекаем текст письма
                body_text = ''
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == 'text/plain':
                            body_text = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                            break
                else:
                    body_text = msg.get_payload(decode=True).decode('utf-8', errors='ignore')
                
                # Ищем код подтверждения (обычно 6-8 цифр)
                code_match = re.search(r'\b(\d{6,8})\b', body_text)
                
                if code_match:
                    verification_code = code_match.group(1)
                    mail.logout()
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'code': verification_code,
                            'email': email_address,
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
            'body': json.dumps({'error': f'GMX authentication failed: {str(e)}'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Server error: {str(e)}'}),
            'isBase64Encoded': False
        }
