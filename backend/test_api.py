"""
Quick API test script

Run this after starting the server to verify everything works.
"""
import requests
import json


def test_health():
    """Test health endpoint"""
    print("🏥 Testing health endpoint...")
    response = requests.get("http://localhost:8000/api/v1/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    print()


def test_evaluation_good():
    """Test evaluation with good output"""
    print("✅ Testing evaluation (good output)...")
    
    payload = {
        "prompt": "What is the capital of France?",
        "model_output": "The capital of France is Paris, which is located on the Seine River in northern France.",
        "context": [
            "Paris is the capital and most populous city of France.",
            "The city is located on the Seine River in northern France."
        ],
        "metadata": {
            "model": "test-model",
            "temperature": 0.7
        }
    }
    
    response = requests.post(
        "http://localhost:8000/api/v1/evaluate",
        json=payload
    )
    
    print(f"   Status: {response.status_code}")
    result = response.json()
    print(f"   Risk Level: {result['overall_risk']}")
    print(f"   Action: {result['recommended_action']}")
    print(f"   Hallucination Score: {result['hallucination']['score']:.2f}")
    print(f"   Safety Score: {result['safety']['score']:.2f}")
    print(f"   Confidence Score: {result['confidence']['score']:.2f}")
    print(f"   Summary: {result['summary']}")
    print(f"   Processing Time: {result['processing_time_ms']:.1f}ms")
    print()


def test_evaluation_hallucinated():
    """Test evaluation with hallucinated output"""
    print("⚠️  Testing evaluation (hallucinated output)...")
    
    payload = {
        "prompt": "What is the capital of France?",
        "model_output": "The capital of France is Lyon, which is famous for its Roman architecture and is the second largest city in France.",
        "context": [
            "Paris is the capital and most populous city of France."
        ]
    }
    
    response = requests.post(
        "http://localhost:8000/api/v1/evaluate",
        json=payload
    )
    
    print(f"   Status: {response.status_code}")
    result = response.json()
    print(f"   Risk Level: {result['overall_risk']}")
    print(f"   Action: {result['recommended_action']}")
    print(f"   Hallucination Score: {result['hallucination']['score']:.2f}")
    print(f"   Unsupported Claims: {len(result['hallucination']['unsupported_claims'])}")
    print(f"   Summary: {result['summary']}")
    print()


def test_evaluation_no_context():
    """Test evaluation without context"""
    print("🔍 Testing evaluation (no context)...")
    
    payload = {
        "prompt": "What is quantum computing?",
        "model_output": "Quantum computing uses quantum bits or qubits to perform calculations much faster than classical computers."
    }
    
    response = requests.post(
        "http://localhost:8000/api/v1/evaluate",
        json=payload
    )
    
    print(f"   Status: {response.status_code}")
    result = response.json()
    print(f"   Risk Level: {result['overall_risk']}")
    print(f"   Hallucination Score: {result['hallucination']['score']:.2f}")
    print(f"   Explanation: {result['hallucination']['explanation']}")
    print()


if __name__ == "__main__":
    print("="*60)
    print("🧪 AI GUARDIAN API TESTS")
    print("="*60)
    print()
    
    try:
        test_health()
        test_evaluation_good()
        test_evaluation_hallucinated()
        test_evaluation_no_context()
        
        print("="*60)
        print("✅ ALL TESTS COMPLETED")
        print("="*60)
        
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the API")
        print("   Make sure the server is running: uvicorn app.main:app --reload")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
