#!/bin/bash

echo "Testing Docker bcrypt setup..."

# Build the image
echo "Building Docker image..."
docker build -t sensemaker-test .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi

# Test bcrypt loading
echo "Testing bcrypt module loading..."
docker run --rm sensemaker-test node -e "
try {
    const bcrypt = require('bcrypt');
    console.log('✅ bcrypt module loaded successfully');
    const hash = bcrypt.hashSync('test', 10);
    console.log('✅ bcrypt hashing works');
    const isValid = bcrypt.compareSync('test', hash);
    console.log('✅ bcrypt comparison works:', isValid);
} catch (error) {
    console.error('❌ bcrypt test failed:', error.message);
    process.exit(1);
}
"

if [ $? -eq 0 ]; then
    echo "✅ All tests passed! Docker setup is working correctly."
else
    echo "❌ Tests failed. Check the error messages above."
    exit 1
fi 