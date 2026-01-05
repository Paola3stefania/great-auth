# Database Migration Lambda Function

This Lambda function runs database migrations for your application using Drizzle ORM.

## Prerequisites

1. AWS CLI installed and configured
2. AWS RDS PostgreSQL database
3. Lambda execution role with VPC access permissions
4. RDS in a VPC with proper security groups

## Setup Instructions

### Step 1: Create Lambda Execution Role

Create an IAM role for Lambda with the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface",
        "ec2:AssignPrivateIpAddresses",
        "ec2:UnassignPrivateIpAddresses"
      ],
      "Resource": "*"
    }
  ]
}
```

Attach the AWS managed policy `AWSLambdaVPCAccessExecutionRole` to this role.

### Step 2: Get VPC and Security Group IDs

From AWS RDS Console:
1. Select your RDS instance
2. Go to "Connectivity & security" tab
3. Note the **VPC ID** and **Subnet IDs**
4. Note the **Security group ID** (used by RDS)

Create a new security group for Lambda (or reuse existing):
- Outbound rule: Allow TCP port 5432 to the RDS security group

### Step 3: Build and Package Lambda

```bash
cd lambda/migrate
chmod +x deploy.sh
./deploy.sh
```

This creates `migration-lambda.zip` ready for deployment.

### Step 4: Deploy Lambda Function

**Option A: Using AWS Console**

1. Go to AWS Lambda Console
2. Click "Create function"
3. Choose "Author from scratch"
4. Configure:
   - **Function name**: `db-migrate`
   - **Runtime**: Node.js 20.x
   - **Architecture**: x86_64
   - **Execution role**: Use the role created in Step 1
5. Click "Create function"
6. Upload `migration-lambda.zip` in the "Code" tab
7. Configure:
   - **Handler**: `index.handler`
   - **Timeout**: 5 minutes (300 seconds)
   - **Memory**: 512 MB (or more if needed)
8. Under "Configuration" → "Environment variables":
   - Add `POSTGRES_URL` with your RDS connection string
9. Under "Configuration" → "VPC":
   - Select the same VPC as your RDS instance
   - Select at least 2 subnets (different AZs)
   - Select the security group created in Step 2
10. Click "Save"

**Option B: Using AWS CLI**

```bash
# Create function (first time)
aws lambda create-function \
  --function-name db-migrate \
  --runtime nodejs20.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-vpc-execution-role \
  --handler index.handler \
  --zip-file fileb://migration-lambda.zip \
  --timeout 300 \
  --memory-size 512 \
  --environment Variables="{POSTGRES_URL=postgres://user:pass@host:5432/dbname}" \
  --vpc-config SubnetIds=subnet-xxx,subnet-yyy,SecurityGroupIds=sg-xxx

# Update function code (subsequent deployments)
aws lambda update-function-code \
  --function-name db-migrate \
  --zip-file fileb://migration-lambda.zip

# Update environment variables
aws lambda update-function-configuration \
  --function-name db-migrate \
  --environment Variables="{POSTGRES_URL=postgres://user:pass@host:5432/dbname}"
```

### Step 5: Invoke Lambda

**Option A: Using AWS Console**
1. Go to Lambda function → "Test" tab
2. Create a test event (any JSON, e.g., `{}`)
3. Click "Test"

**Option B: Using AWS CLI**
```bash
aws lambda invoke \
  --function-name db-migrate \
  --payload '{}' \
  response.json

cat response.json
```

**Option C: From Amplify Build (Optional)**

Add to `amplify.yml` (after making RDS accessible to Lambda):
```yaml
post_build:
  commands:
    - aws lambda invoke --function-name db-migrate --payload '{}' migrate-response.json || true
```

## Troubleshooting

### Connection Timeout
- Verify Lambda is in the same VPC as RDS
- Check security group allows outbound on port 5432
- Ensure RDS security group allows inbound from Lambda security group

### Migration Not Found
- Ensure `migrations` folder is included in the zip
- Check migrations folder structure matches Drizzle expectations

### Timeout Errors
- Increase Lambda timeout (max 15 minutes)
- Check CloudWatch logs for specific errors

### Permission Errors
- Verify Lambda execution role has VPC access permissions
- Check RDS security group allows connections from Lambda security group

## Running Migrations Manually

If Lambda is not set up, you can still run migrations from your local machine:

```bash
export POSTGRES_URL="postgres://user:pass@host:5432/dbname"
npm run db:migrate
```
