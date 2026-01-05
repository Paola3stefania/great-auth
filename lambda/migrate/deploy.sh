#!/bin/bash

# Lambda Migration Deployment Script
# This script builds and packages the Lambda function for deployment

set -e

echo "Building Lambda function..."

# Navigate to lambda directory
cd "$(dirname "$0")"

# Install dependencies
echo "Installing dependencies..."
npm ci --production

# Build TypeScript
echo "Building TypeScript..."
npm run build

# Copy migrations folder (drizzle needs this for migrate function)
echo "Copying migrations..."
mkdir -p ./migrations
cp -r ../../lib/db/migrations/* ./migrations/

# Package Lambda function
echo "Packaging Lambda function..."
zip -r migration-lambda.zip . \
  -x '*.ts' \
  -x '*.tsx' \
  -x 'node_modules/@types/**' \
  -x '*.map' \
  -x '.git/**' \
  -x 'deploy.sh' \
  -x 'package.json' \
  -x 'tsconfig.json'

echo "✅ Lambda package created: migration-lambda.zip"
echo ""
echo "Next steps:"
echo "1. Upload migration-lambda.zip to AWS Lambda via AWS Console or CLI"
echo "2. Configure Lambda:"
echo "   - Runtime: Node.js 20.x (or latest LTS)"
echo "   - Handler: index.handler"
echo "   - Timeout: 5 minutes (300 seconds)"
echo "   - Environment variables: POSTGRES_URL"
echo "   - VPC: Same VPC as your RDS instance"
echo "   - Security Groups: Allow outbound to RDS port 5432"
echo ""
echo "To deploy via AWS CLI:"
echo "  aws lambda create-function \\"
echo "    --function-name db-migrate \\"
echo "    --runtime nodejs20.x \\"
echo "    --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-vpc-execution-role \\"
echo "    --handler index.handler \\"
echo "    --zip-file fileb://migration-lambda.zip \\"
echo "    --timeout 300 \\"
echo "    --environment Variables={POSTGRES_URL=your-connection-string} \\"
echo "    --vpc-config SubnetIds=subnet-xxx,subnet-yyy,SecurityGroupIds=sg-xxx"
