# FROM --platform=linux/amd64 public.ecr.aws/lambda/nodejs:12

# COPY app.js ./

# # You can overwrite command in `serverless.yml` template
# CMD ["app.handler"]
FROM --platform=linux/amd64 public.ecr.aws/lambda/nodejs:18

RUN ls -lrt

# Assumes your function is named "app.js", and there is a package.json file in the app directory 

# Assumes your function is named "app.js", and there is a package.json file in the app directory 
COPY dist package.json  ${LAMBDA_TASK_ROOT}/

RUN ls -lrt

# Install NPM dependencies for function
RUN npm install

RUN ls -lrt

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "app.handler" ]

