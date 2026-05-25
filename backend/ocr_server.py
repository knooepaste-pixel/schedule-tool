"""
课表截图AI识别服务
使用阿里云视觉智能开放平台的通用OCR能力
"""

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import base64
import json
import re
import httpx
from typing import Optional

app = FastAPI(title="课表OCR识别服务")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 阿里云OCR API配置
# 免费额度：每月500次
ALIYUN_API_KEY = "your_aliyun_api_key"  # 需要替换为实际API Key
ALIYUN_API_URL = "https://ocr-api.cn-hangzhou.aliyuncs.com/api/v1/ocr/text_recognition"

# 备选：使用免费的Google Vision API
# 需要设置环境变量 GOOGLE_APPLICATION_CREDENTIALS

def parse_schedule_text(text: str) -> dict:
    """解析课表文本"""
    courses = []
    lines = text.split('\n')

    day_map = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 7, '天': 7,
        '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
    }

    current_course = {}

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # 检测星期几
        day_match = re.search(r'周([一二三四五六日天])', line)
        if day_match:
            if current_course and 'name' in current_course:
                courses.append(current_course)
            current_course = {'dayOfWeek': day_map.get(day_match.group(1), 1)}

        # 检测课程名称（中文开头，不是纯数字或特殊字符）
        name_match = re.match(r'^([\u4e00-\u9fa5]{2,20}[^\s\d周]*)\s', line)
        if name_match and 'name' not in current_course:
            current_course['name'] = name_match.group(1).strip()

        # 检测节次
        section_match = re.search(r'第?(\d+)\s*[-到至]\s*第?(\d+)\s*[节课]', line)
        if section_match:
            current_course['startSection'] = int(section_match.group(1))
            current_course['endSection'] = int(section_match.group(2))

        # 检测地点
        location_match = re.search(r'(?:望院|博学楼|理学楼|教学楼|[A-Z]\d+楼|\S+楼\d+)[\d室]?', line)
        if location_match:
            current_course['location'] = location_match.group(0)

        # 检测教师
        teacher_match = re.search(r'教师[：:]\s*([^\s\d]+)', line)
        if teacher_match:
            current_course['teacher'] = teacher_match.group(1)

    if current_course and 'name' in current_course:
        courses.append(current_course)

    # 去重
    seen = set()
    unique_courses = []
    for c in courses:
        key = (c.get('name'), c.get('dayOfWeek'), c.get('startSection'))
        if key not in seen:
            seen.add(key)
            unique_courses.append(c)

    return {"courses": unique_courses, "raw_text": text}

@app.post("/api/ocr")
async def recognize_schedule(file: UploadFile = File(...)):
    """使用AI识别课表截图"""
    try:
        # 读取图片文件
        image_data = await file.read()
        image_base64 = base64.b64encode(image_data).decode('utf-8')

        # 尝试使用阿里云OCR
        headers = {
            'Authorization': f'APPCODE {ALIYUN_API_KEY}',
            'Content-Type': 'application/json',
        }

        payload = {
            "image": image_base64,
            "prob": True,
            "rotate": True,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(ALIYUN_API_URL, json=payload, headers=headers)

            if response.status_code == 200:
                result = response.json()
                text = extract_text_from_aliyun_result(result)
                return parse_schedule_text(text)
            else:
                return {"error": f"OCR API error: {response.status_code}"}

    except Exception as e:
        return {"error": str(e)}

def extract_text_from_aliyun_result(result: dict) -> str:
    """从阿里云OCR结果中提取文本"""
    try:
        if 'data' in result and 'text' in result['data']:
            return result['data']['text']
        return ""
    except:
        return ""

@app.post("/api/parse-text")
async def parse_text(text: str):
    """直接解析文本"""
    return parse_schedule_text(text)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
