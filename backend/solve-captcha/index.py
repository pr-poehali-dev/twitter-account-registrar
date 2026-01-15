import json
import os
import requests
import time

def handler(event: dict, context) -> dict:
    '''Разгадывает капчу на x.com через сервис 2captcha и возвращает токен решения'''
    
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
    
    api_key = os.environ.get('CAPTCHA_API_KEY', '')
    
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'CAPTCHA_API_KEY not configured'}),
            'isBase64Encoded': False
        }
    
    body = json.loads(event.get('body', '{}'))
    site_key = body.get('sitekey', '6LdWKJAUAAAAAB6f9YxZz8r4hK7tO3e9z4LpHKbN')  # Twitter reCAPTCHA sitekey
    page_url = body.get('url', 'https://x.com')
    
    try:
        # Отправляем капчу на решение
        submit_url = 'http://2captcha.com/in.php'
        submit_params = {
            'key': api_key,
            'method': 'userrecaptcha',
            'googlekey': site_key,
            'pageurl': page_url,
            'json': 1
        }
        
        submit_response = requests.post(submit_url, data=submit_params, timeout=30)
        submit_result = submit_response.json()
        
        if submit_result.get('status') != 1:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': f'Captcha submission failed: {submit_result.get("request", "Unknown error")}'
                }),
                'isBase64Encoded': False
            }
        
        captcha_id = submit_result.get('request')
        
        # Ждем решения (обычно 15-30 секунд)
        result_url = 'http://2captcha.com/res.php'
        max_attempts = 20
        
        for attempt in range(max_attempts):
            time.sleep(5)
            
            result_params = {
                'key': api_key,
                'action': 'get',
                'id': captcha_id,
                'json': 1
            }
            
            result_response = requests.get(result_url, params=result_params, timeout=30)
            result_data = result_response.json()
            
            if result_data.get('status') == 1:
                # Капча разгадана
                captcha_token = result_data.get('request')
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'token': captcha_token,
                        'success': True,
                        'solveTime': (attempt + 1) * 5
                    }),
                    'isBase64Encoded': False
                }
            
            if result_data.get('request') != 'CAPCHA_NOT_READY':
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'error': f'Captcha solving failed: {result_data.get("request", "Unknown error")}'
                    }),
                    'isBase64Encoded': False
                }
        
        # Таймаут
        return {
            'statusCode': 408,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Captcha solving timeout'}),
            'isBase64Encoded': False
        }
        
    except requests.exceptions.RequestException as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Request failed: {str(e)}'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Server error: {str(e)}'}),
            'isBase64Encoded': False
        }
