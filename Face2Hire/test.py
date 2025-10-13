import google.generativeai as genai

# Directly paste your Gemini API key here for testing
genai.configure(api_key="AIzaSyAo8DvhIs-ySpPx6DZh32kyDK7dY-UO5hM")



for m in genai.list_models():
    print(m.name)
