
# Custompsych Application Environment Configuration Guide\

This document serves as a guide to manage and configure environment settings for the Custompsych application, both for local development and for deployment to Google Cloud App Engine.

## Environment Variables

### Local Development

- **Source**: Local environment variables are managed through a `.env` file at the root of your project.

- **Contents of `.env`**:

```
    KEY_FILE="custompsych-88cecf1d90b5.json"
```

- **Purpose**: This file includes the environment configuration. In this case, it's the filename (or path) to the API key file for database operations.

- **Code Reference**: In the `backend/myserver.js` file, the environment variables are loaded early in the application lifecycle:
```
	if (process.env.NODE_ENV !== 'production') {
		require('dotenv').config();
	}
```
This only happens if we're running the application locally, since cloud-deployed versions need a separate environment variable file.

### Production - Google Cloud App Engine

- **Source**: Production environment variables are declared in the app.yaml file located at the root of the project.

- **Code Snippet from app.yaml:**
```
	runtime: nodejs18
	instance_class: F2
	automatic_scaling:
		target_cpu_utilization: 0.65
		min_instances: 1
		max_instances: 10
	env_variables:
		NODE_ENV: 'production'
		KEY_FILE: 'custompsych-88cecf1d90b5.json'
```

## Running the App

### Locally:

To run the application locally with the development settings, use the following command:

```
	npm run dev
```

The `package.json` file is configured to preload the dotenv module which reads the .env file (see snippet below):
```
	"scripts": {
		"start": "node backend/myserver.js",
		"dev": "NODE_ENV=development node -r dotenv/config backend/myserver.js"
	}
```

### On Google Cloud App Engine:

For deployment to Google Cloud App Engine, use:
```
	gcloud app deploy
```
The start command in package.json is optimized for production and does not override NODE_ENV, ensuring that the environment variables from app.yaml are used (gcloud will default to running the `start` command):
```
	"scripts": {
		"start": "node backend/myserver.js",
		"dev": "NODE_ENV=development node -r dotenv/config backend/myserver.js"
	}
```

## Important Notes

- **Secrets**: The secret API key (*e.g.*: `custompsych-88cecf1d90b5.json`)should only exist locally but should **never** be committed to version control. Ensure it is listed in `.gitignore` and `.gcloudignore`.

- **Environment Variable Consistency:** If you use the same secrets for local development and cloud deployment, make sure the KEY_FILE variable are consistently named and valued across your local .env file and the app.yaml file for production.

- **Separation of Environments:** The configuration splits the handling of environment variables between local development (dotenv) and production (App Engine's environment configuration) to avoid cross-environment issues.
