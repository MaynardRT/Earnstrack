# CI/CD Guide

This repository now includes GitHub Actions workflows for continuous integration and continuous delivery.

The delivery workflow now includes automatic frontend deployment to GitHub Pages and artifact packaging for the backend.

Repository: `MaynardRT/Earnstack`

## Workflows

### CI

File: `.github/workflows/ci.yml`

Runs on pushes and pull requests targeting `main` or `master`.

It performs:

1. Backend restore, build, and test using `.NET 10`.
2. Frontend dependency install with `npm ci`.
3. Frontend lint.
4. Frontend unit tests.
5. Frontend production build.

### CD

File: `.github/workflows/cd.yml`

Runs on:

1. Pushes to `main` or `master`
2. Tags matching `v*`
3. Manual runs via `workflow_dispatch`

It performs:

1. Backend publish to a deployable folder.
2. Frontend production build.
3. Automatic frontend deployment to GitHub Pages on pushes to `main` or `master`.
4. Upload of backend and frontend build artifacts to the workflow run.
5. Creation of a GitHub Release with packaged backend and frontend archives when a version tag such as `v1.0.0` is pushed.

## Required Repository Setup

### Recommended Branch

Use `main` as the primary branch on GitHub. The workflows also support `master` to match the current local repository state.

### Optional Secret

Add this repository secret if your production frontend should call a deployed API:

- `VITE_API_URL`: for example `https://your-api-domain.example.com/api`

If this secret is not set, the frontend build falls back to `http://localhost:5000/api`, which is suitable for CI validation but not for production deployment.

### GitHub Pages

In the GitHub repository settings:

1. Open `Settings -> Pages`
2. Set `Source` to `GitHub Actions`
3. Make sure the default branch is `main`

The workflow deploys the frontend to:

- `https://maynardrt.github.io/Earnstack/`

This assumes the repository name remains `Earnstack`.

## How To Use

### Run CI

Open a pull request or push changes to `main` or `master`.

### Produce Delivery Artifacts

Push to `main` or `master`, then download these workflow artifacts from the Actions run:

1. `etracker-backend-publish`
2. `etracker-frontend-dist`

### Deploy Frontend Automatically

Push to `main` or `master` after enabling GitHub Pages with `GitHub Actions` as the source.

The workflow will:

1. Build the frontend with the repository subpath as the Vite base path.
2. Publish the site to GitHub Pages.
3. Generate a `404.html` fallback so client-side routes keep working.
4. Use the `VITE_API_URL` repository secret as the production API endpoint.

### Required GitHub Secret

Add this repository secret before relying on the public frontend:

1. Open `Settings -> Secrets and variables -> Actions`
2. Create secret `VITE_API_URL`
3. Set it to your deployed backend API URL, for example:

```text
https://your-backend-host.example.com/api
```

Without this secret, the built frontend will fall back to `http://localhost:5000/api`, which will not work for public GitHub Pages users.

### Create A Versioned Release

Push a Git tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

That will create a GitHub Release containing:

1. `etracker-backend-v1.0.0.tar.gz`
2. `etracker-frontend-v1.0.0.tar.gz`

## Notes

1. The frontend is now configured to work from the GitHub Pages repository subpath.
2. The backend is still delivered as a deployable artifact because the repository does not yet define a concrete production host for the API.
3. If you want fully automated backend deployment to Azure, Render, Railway, IIS, or another target, the next step is to add a deployment-specific workflow and the required secrets.
4. If you rename the GitHub repository again, the Pages URL and base path will change with the repository name.

For a concrete free-hosting setup using GitHub Pages plus Render, see `documentation/FREE_DEPLOYMENT.md`.
