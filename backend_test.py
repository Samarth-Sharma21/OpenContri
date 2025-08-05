#!/usr/bin/env python3
"""
RepoHub Backend API Testing Suite
Tests all backend endpoints for the RepoHub SaaS application
"""

import requests
import json
import os
import sys
from datetime import datetime
import uuid

# Load environment variables
def load_env():
    env_vars = {}
    try:
        with open('/app/.env', 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    env_vars[key] = value
    except FileNotFoundError:
        print("❌ .env file not found")
        return None
    return env_vars

class RepoHubBackendTester:
    def __init__(self):
        self.env = load_env()
        if not self.env:
            sys.exit(1)
        
        # Use localhost for testing since external URL has routing issues
        self.base_url = "http://localhost:3000"
        self.api_url = f"{self.base_url}/api"
        self.session = requests.Session()
        self.test_results = []
        
        print(f"🔧 Testing backend at: {self.api_url}")
        print("=" * 60)

    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        })

    def test_api_root(self):
        """Test GET /api - API root endpoint"""
        try:
            response = self.session.get(f"{self.api_url}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == "RepoHub API is running":
                    self.log_test("API Root", True, "API root endpoint working correctly")
                    return True
                else:
                    self.log_test("API Root", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("API Root", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("API Root", False, f"Request failed: {str(e)}")
            return False

    def test_submissions_get(self):
        """Test GET /api/submissions - fetch all submissions"""
        try:
            response = self.session.get(f"{self.api_url}/submissions")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Submissions GET", True, f"Retrieved {len(data)} submissions")
                    return True
                else:
                    self.log_test("Submissions GET", False, f"Expected array, got: {type(data)}")
                    return False
            else:
                self.log_test("Submissions GET", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Submissions GET", False, f"Request failed: {str(e)}")
            return False

    def test_submissions_post_unauthorized(self):
        """Test POST /api/submissions without authentication - should return 401"""
        try:
            test_submission = {
                "url": "https://github.com/test/repo",
                "title": "Test Repository",
                "description": "A test repository for API testing",
                "tags": ["javascript", "testing"],
                "platform": "github",
                "username": "testuser",
                "language": "JavaScript",
                "stars": 42
            }
            
            response = self.session.post(
                f"{self.api_url}/submissions",
                json=test_submission,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 401:
                data = response.json()
                if data.get('error') == 'Unauthorized':
                    self.log_test("Submissions POST (Unauth)", True, "Correctly rejected unauthorized request")
                    return True
                else:
                    self.log_test("Submissions POST (Unauth)", False, f"Wrong error message: {data}")
                    return False
            else:
                self.log_test("Submissions POST (Unauth)", False, f"Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Submissions POST (Unauth)", False, f"Request failed: {str(e)}")
            return False

    def test_comments_get_missing_params(self):
        """Test GET /api/comments without required parameters - should return 400"""
        try:
            response = self.session.get(f"{self.api_url}/comments")
            
            if response.status_code == 400:
                data = response.json()
                if 'repoId or repoUrl is required' in data.get('error', ''):
                    self.log_test("Comments GET (No Params)", True, "Correctly rejected request without parameters")
                    return True
                else:
                    self.log_test("Comments GET (No Params)", False, f"Wrong error message: {data}")
                    return False
            else:
                self.log_test("Comments GET (No Params)", False, f"Expected 400, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Comments GET (No Params)", False, f"Request failed: {str(e)}")
            return False

    def test_comments_get_with_repo_url(self):
        """Test GET /api/comments?repoUrl=X - fetch comments for a repo URL"""
        try:
            test_repo_url = "https://github.com/test/sample-repo"
            response = self.session.get(f"{self.api_url}/comments?repoUrl={test_repo_url}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Comments GET (RepoURL)", True, f"Retrieved {len(data)} comments for repo URL")
                    return True
                else:
                    self.log_test("Comments GET (RepoURL)", False, f"Expected array, got: {type(data)}")
                    return False
            else:
                self.log_test("Comments GET (RepoURL)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Comments GET (RepoURL)", False, f"Request failed: {str(e)}")
            return False

    def test_comments_get_with_repo_id(self):
        """Test GET /api/comments?repoId=X - fetch comments for a repo ID"""
        try:
            test_repo_id = str(uuid.uuid4())
            response = self.session.get(f"{self.api_url}/comments?repoId={test_repo_id}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Comments GET (RepoID)", True, f"Retrieved {len(data)} comments for repo ID")
                    return True
                else:
                    self.log_test("Comments GET (RepoID)", False, f"Expected array, got: {type(data)}")
                    return False
            else:
                self.log_test("Comments GET (RepoID)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Comments GET (RepoID)", False, f"Request failed: {str(e)}")
            return False

    def test_comments_post_unauthorized(self):
        """Test POST /api/comments without authentication - should return 401"""
        try:
            test_comment = {
                "repoUrl": "https://github.com/test/repo",
                "text": "This is a test comment",
                "username": "testuser"
            }
            
            response = self.session.post(
                f"{self.api_url}/comments",
                json=test_comment,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 401:
                data = response.json()
                if data.get('error') == 'Unauthorized':
                    self.log_test("Comments POST (Unauth)", True, "Correctly rejected unauthorized request")
                    return True
                else:
                    self.log_test("Comments POST (Unauth)", False, f"Wrong error message: {data}")
                    return False
            else:
                self.log_test("Comments POST (Unauth)", False, f"Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Comments POST (Unauth)", False, f"Request failed: {str(e)}")
            return False

    def test_comments_put_unauthorized(self):
        """Test PUT /api/comments/{id} without authentication - should return 401"""
        try:
            test_comment_id = str(uuid.uuid4())
            test_update = {
                "text": "Updated comment text"
            }
            
            response = self.session.put(
                f"{self.api_url}/comments/{test_comment_id}",
                json=test_update,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 401:
                data = response.json()
                if data.get('error') == 'Unauthorized':
                    self.log_test("Comments PUT (Unauth)", True, "Correctly rejected unauthorized request")
                    return True
                else:
                    self.log_test("Comments PUT (Unauth)", False, f"Wrong error message: {data}")
                    return False
            else:
                self.log_test("Comments PUT (Unauth)", False, f"Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Comments PUT (Unauth)", False, f"Request failed: {str(e)}")
            return False

    def test_comments_delete_unauthorized(self):
        """Test DELETE /api/comments/{id} without authentication - should return 401"""
        try:
            test_comment_id = str(uuid.uuid4())
            
            response = self.session.delete(f"{self.api_url}/comments/{test_comment_id}")
            
            if response.status_code == 401:
                data = response.json()
                if data.get('error') == 'Unauthorized':
                    self.log_test("Comments DELETE (Unauth)", True, "Correctly rejected unauthorized request")
                    return True
                else:
                    self.log_test("Comments DELETE (Unauth)", False, f"Wrong error message: {data}")
                    return False
            else:
                self.log_test("Comments DELETE (Unauth)", False, f"Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Comments DELETE (Unauth)", False, f"Request failed: {str(e)}")
            return False

    def test_invalid_route(self):
        """Test invalid route - should return 404"""
        try:
            response = self.session.get(f"{self.api_url}/invalid-endpoint")
            
            if response.status_code == 404:
                data = response.json()
                if 'not found' in data.get('error', '').lower():
                    self.log_test("Invalid Route", True, "Correctly returned 404 for invalid route")
                    return True
                else:
                    self.log_test("Invalid Route", False, f"Wrong error message: {data}")
                    return False
            else:
                self.log_test("Invalid Route", False, f"Expected 404, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Invalid Route", False, f"Request failed: {str(e)}")
            return False

    def test_cors_headers(self):
        """Test CORS headers are properly set"""
        try:
            response = self.session.options(f"{self.api_url}")
            
            if response.status_code == 200:
                headers = response.headers
                cors_headers = [
                    'Access-Control-Allow-Origin',
                    'Access-Control-Allow-Methods',
                    'Access-Control-Allow-Headers'
                ]
                
                missing_headers = [h for h in cors_headers if h not in headers]
                
                if not missing_headers:
                    self.log_test("CORS Headers", True, "All required CORS headers present")
                    return True
                else:
                    self.log_test("CORS Headers", False, f"Missing headers: {missing_headers}")
                    return False
            else:
                self.log_test("CORS Headers", False, f"OPTIONS request failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("CORS Headers", False, f"Request failed: {str(e)}")
            return False

    def test_supabase_connection(self):
        """Test Supabase connection by checking if submissions endpoint works"""
        try:
            # This is essentially testing the database connection through the API
            response = self.session.get(f"{self.api_url}/submissions")
            
            if response.status_code == 200:
                self.log_test("Supabase Connection", True, "Database connection working (via submissions endpoint)")
                return True
            else:
                self.log_test("Supabase Connection", False, f"Database connection failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Supabase Connection", False, f"Database connection test failed: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting RepoHub Backend API Tests")
        print("=" * 60)
        
        # Core API tests
        tests = [
            self.test_api_root,
            self.test_supabase_connection,
            self.test_cors_headers,
            self.test_submissions_get,
            self.test_submissions_post_unauthorized,
            self.test_comments_get_missing_params,
            self.test_comments_get_with_repo_url,
            self.test_comments_get_with_repo_id,
            self.test_comments_post_unauthorized,
            self.test_comments_put_unauthorized,
            self.test_comments_delete_unauthorized,
            self.test_invalid_route
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ Test {test.__name__} crashed: {str(e)}")
                failed += 1
            print()  # Add spacing between tests
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        if failed == 0:
            print("\n🎉 All backend tests passed! The API is working correctly.")
        else:
            print(f"\n⚠️  {failed} test(s) failed. Check the details above.")
        
        return failed == 0

if __name__ == "__main__":
    tester = RepoHubBackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)