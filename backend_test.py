import requests
import sys
import json
from datetime import datetime

class OrquestradorAPITester:
    def __init__(self, base_url="https://agent-processor.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, expected_fields=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            print(f"   Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Check response structure if expected_fields provided
                if expected_fields and response.status_code == 200:
                    try:
                        response_data = response.json()
                        print(f"   Response: {json.dumps(response_data, indent=2)}")
                        
                        # Validate expected fields
                        for field in expected_fields:
                            if field not in response_data:
                                print(f"⚠️  Warning: Expected field '{field}' not found in response")
                            else:
                                print(f"✓ Field '{field}' found")
                                
                    except json.JSONDecodeError:
                        print(f"⚠️  Warning: Response is not valid JSON")
                        
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_response = response.json()
                    print(f"   Error Response: {json.dumps(error_response, indent=2)}")
                except:
                    print(f"   Error Response: {response.text}")

            return success, response.json() if response.status_code == 200 else {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            return False, {}
        except requests.exceptions.ConnectionError:
            print(f"❌ Failed - Connection error")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "api/",
            200,
            expected_fields=["message"]
        )

    def test_orquestrador_criativo_texto(self):
        """Test creative text classification"""
        return self.run_test(
            "Orquestrador - Criativo/Texto",
            "POST",
            "api/orquestrador",
            200,
            data={"pedido": "Crie uma campanha publicitária"},
            expected_fields=["estado", "resultado"]
        )

    def test_orquestrador_criativo_documento(self):
        """Test creative document classification"""
        return self.run_test(
            "Orquestrador - Criativo/Documento",
            "POST",
            "api/orquestrador",
            200,
            data={"pedido": "Gere um relatório de vendas"},
            expected_fields=["estado", "resultado"]
        )

    def test_orquestrador_criativo_imagem(self):
        """Test creative image classification"""
        return self.run_test(
            "Orquestrador - Criativo/Imagem",
            "POST",
            "api/orquestrador",
            200,
            data={"pedido": "Crie uma imagem de um gato"},
            expected_fields=["estado", "resultado"]
        )

    def test_orquestrador_dados_externos(self):
        """Test external data classification"""
        return self.run_test(
            "Orquestrador - Dados Externos",
            "POST",
            "api/orquestrador",
            200,
            data={"pedido": "Busque dados do endpoint /users"},
            expected_fields=["estado", "resultado"]
        )

    def test_orquestrador_informacional(self):
        """Test informational classification"""
        return self.run_test(
            "Orquestrador - Informacional",
            "POST",
            "api/orquestrador",
            200,
            data={"pedido": "Qual é a capital do Brasil?"},
            expected_fields=["estado", "resultado"]
        )

    def test_orquestrador_missing_pedido(self):
        """Test missing pedido field"""
        return self.run_test(
            "Orquestrador - Missing Pedido",
            "POST",
            "api/orquestrador",
            400,
            data={}
        )

    def validate_response_structure(self, response_data, test_name):
        """Validate the structure of orquestrador response"""
        print(f"\n🔍 Validating response structure for {test_name}...")
        
        # Check main structure
        if "estado" not in response_data:
            print("❌ Missing 'estado' field")
            return False
            
        if "resultado" not in response_data:
            print("❌ Missing 'resultado' field")
            return False
            
        estado = response_data["estado"]
        resultado = response_data["resultado"]
        
        # Check estado structure
        required_estado_fields = ["tipo", "acao"]
        for field in required_estado_fields:
            if field not in estado:
                print(f"❌ Missing 'estado.{field}' field")
                return False
                
        # Check resultado structure
        required_resultado_fields = ["message"]
        for field in required_resultado_fields:
            if field not in resultado:
                print(f"❌ Missing 'resultado.{field}' field")
                return False
                
        print("✅ Response structure is valid")
        return True

def main():
    print("🚀 Starting Orquestrador API Tests")
    print("=" * 50)
    
    # Setup
    tester = OrquestradorAPITester()
    
    # Test root endpoint first
    success, _ = tester.test_root_endpoint()
    if not success:
        print("❌ Root endpoint failed, API may not be running")
        return 1

    # Test all orquestrador classifications
    test_cases = [
        ("Criativo/Texto", tester.test_orquestrador_criativo_texto),
        ("Criativo/Documento", tester.test_orquestrador_criativo_documento),
        ("Criativo/Imagem", tester.test_orquestrador_criativo_imagem),
        ("Dados Externos", tester.test_orquestrador_dados_externos),
        ("Informacional", tester.test_orquestrador_informacional),
        ("Missing Pedido", tester.test_orquestrador_missing_pedido)
    ]
    
    detailed_results = []
    
    for test_name, test_func in test_cases:
        success, response_data = test_func()
        
        if success and response_data and test_name != "Missing Pedido":
            # Validate response structure for successful tests
            structure_valid = tester.validate_response_structure(response_data, test_name)
            detailed_results.append({
                "test": test_name,
                "success": success,
                "structure_valid": structure_valid,
                "response": response_data
            })
        else:
            detailed_results.append({
                "test": test_name,
                "success": success,
                "structure_valid": None,
                "response": response_data
            })

    # Print detailed results
    print("\n" + "=" * 50)
    print("📊 DETAILED TEST RESULTS")
    print("=" * 50)
    
    for result in detailed_results:
        print(f"\n🔍 {result['test']}:")
        print(f"   Success: {'✅' if result['success'] else '❌'}")
        if result['structure_valid'] is not None:
            print(f"   Structure: {'✅' if result['structure_valid'] else '❌'}")
        
        if result['response'] and result['success']:
            response = result['response']
            if 'estado' in response:
                estado = response['estado']
                print(f"   Tipo: {estado.get('tipo', 'N/A')}")
                print(f"   Subtipo: {estado.get('subtipo', 'N/A')}")
                print(f"   Ação: {estado.get('acao', 'N/A')}")
            
            if 'resultado' in response:
                resultado = response['resultado']
                print(f"   Message: {resultado.get('message', 'N/A')}")
                if 'mock' in resultado:
                    print(f"   Mock: {'✅' if resultado['mock'] else '❌'}")

    # Print summary
    print(f"\n📊 SUMMARY: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())