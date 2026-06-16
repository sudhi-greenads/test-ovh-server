# Telinfy Server Bootstrap Guide (OVH / K3s)

This guide contains the **exact, verified commands** used to bootstrap the fresh OVH server from zero to a fully running GitOps cluster using k3s and Argo CD.

## 1. Install Kubernetes (k3s)
*Note: We are explicitly disabling `traefik` so NGINX can take over ports 80/443. We are also handling the SELinux requirements for EL10.*

```bash
# Install SELinux dependencies for EL10
dnf install -y container-selinux
dnf install -y https://rpm.rancher.io/k3s/stable/common/centos/9/noarch/k3s-selinux-1.6-1.el9.noarch.rpm

# Install k3s with Traefik disabled
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik" INSTALL_K3S_SELINUX_WARN=true sh -

# Setup kubectl access for root
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
echo "export KUBECONFIG=/etc/rancher/k3s/k3s.yaml" >> ~/.bashrc
```

## 2. Install Required Tools (Helm & Git)
```bash
# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install Git
dnf install git -y
```

## 3. Clone Repository
```bash
cd ~
git clone https://github.com/sudhi-greenads/test-ovh-server.git
cd test-ovh-server/k8s-test
```

## 4. Create Namespaces
Argo CD and the underlying infrastructure expect these namespaces to exist before they are deployed.

```bash
kubectl create namespace f9-test-ns
kubectl create namespace newrelic
kubectl create namespace telinfy-application
kubectl create namespace telinfy-argo
kubectl create namespace telinfy-management
kubectl create namespace telinfy-middleware
```

## 5. Apply Core Secrets
The `all-aws-secrets.yaml` file is intentionally `.gitignore`d for security. You must manually move this file from your local machine to the server.

```bash
# Open nano, paste the contents of your local all-aws-secrets.yaml, and save
nano all-aws-secrets.yaml

# Apply the secrets
kubectl apply -f all-aws-secrets.yaml
```

## 6. Install Argo CD
We use Helm to install Argo CD because we need to apply our custom values (subpath routing).

```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update

helm install telinfy-argo argo/argo-cd \
  --namespace telinfy-argo \
  -f management-argocd/telinfy-argo-values.yaml
```

## 7. Apply the Argo CD AppProject
Before any applications can sync, Argo CD requires the `telinfy` project to exist.

```bash
kubectl apply -f management-argocd/configs/telinfy-project.yaml
```

## 8. Pre-Install Cert-Manager CRDs
To bypass a known race condition where Argo CD attempts to deploy `ClusterIssuers` before the `cert-manager` CRDs are fully ready, install the CRDs directly.

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.15.1/cert-manager.crds.yaml
```

## 9. Deploy the GitOps Workloads
Tell Argo CD to start syncing all your folders from GitHub!

```bash
kubectl apply -f management-argocd/configs/middleware/
kubectl apply -f management-argocd/configs/management/
kubectl apply -f management-argocd/configs/application/
```

## 10. Access the Dashboard
Argo CD is now running. Retrieve your initial admin password:

```bash
kubectl -n telinfy-argo get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
```
You can now log in at: `https://<YOUR-DOMAIN>/k8s-management` with the username `admin` and the password from above.
