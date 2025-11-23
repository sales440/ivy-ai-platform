#!/bin/bash

# Script para configurar GitHub y preparar para Railway deployment
# Ejecuta este script desde el directorio raíz del proyecto

echo "🚀 Ivy.AI Platform - GitHub Setup Script"
echo "=========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json no encontrado${NC}"
    echo "Por favor ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

echo -e "${GREEN}✅ Directorio del proyecto verificado${NC}"
echo ""

# Paso 1: Verificar Git
echo "📋 Paso 1: Verificando Git..."
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git no está instalado${NC}"
    echo "Instala Git desde: https://git-scm.com/downloads"
    exit 1
fi
echo -e "${GREEN}✅ Git instalado: $(git --version)${NC}"
echo ""

# Paso 2: Configurar Git (si no está configurado)
echo "📋 Paso 2: Configurando Git..."
if [ -z "$(git config user.name)" ]; then
    echo -e "${YELLOW}⚠️  Git user.name no configurado${NC}"
    read -p "Ingresa tu nombre: " git_name
    git config --global user.name "$git_name"
    echo -e "${GREEN}✅ Git user.name configurado${NC}"
else
    echo -e "${GREEN}✅ Git user.name: $(git config user.name)${NC}"
fi

if [ -z "$(git config user.email)" ]; then
    echo -e "${YELLOW}⚠️  Git user.email no configurado${NC}"
    read -p "Ingresa tu email: " git_email
    git config --global user.email "$git_email"
    echo -e "${GREEN}✅ Git user.email configurado${NC}"
else
    echo -e "${GREEN}✅ Git user.email: $(git config user.email)${NC}"
fi
echo ""

# Paso 3: Inicializar repositorio Git
echo "📋 Paso 3: Inicializando repositorio Git..."
if [ -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Repositorio Git ya existe${NC}"
    read -p "¿Quieres reinicializar? (y/N): " reinit
    if [ "$reinit" = "y" ] || [ "$reinit" = "Y" ]; then
        rm -rf .git
        git init
        echo -e "${GREEN}✅ Repositorio reinicializado${NC}"
    else
        echo -e "${GREEN}✅ Usando repositorio existente${NC}"
    fi
else
    git init
    echo -e "${GREEN}✅ Repositorio Git inicializado${NC}"
fi
echo ""

# Paso 4: Crear .gitignore si no existe
echo "📋 Paso 4: Verificando .gitignore..."
if [ ! -f ".gitignore" ]; then
    echo -e "${YELLOW}⚠️  .gitignore no encontrado, creando...${NC}"
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/
out/

# Environment variables
.env
.env.local
.env.production
.env.development

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Database
*.db
*.sqlite

# Temporary files
*.tmp
.cache/
EOF
    echo -e "${GREEN}✅ .gitignore creado${NC}"
else
    echo -e "${GREEN}✅ .gitignore existe${NC}"
fi
echo ""

# Paso 5: Agregar archivos al staging
echo "📋 Paso 5: Agregando archivos al staging..."
git add .
echo -e "${GREEN}✅ Archivos agregados${NC}"
echo ""

# Paso 6: Crear commit inicial
echo "📋 Paso 6: Creando commit inicial..."
if git rev-parse HEAD >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Ya existen commits en el repositorio${NC}"
    read -p "¿Quieres crear un nuevo commit? (y/N): " new_commit
    if [ "$new_commit" = "y" ] || [ "$new_commit" = "Y" ]; then
        read -p "Mensaje del commit: " commit_msg
        git commit -m "$commit_msg"
        echo -e "${GREEN}✅ Commit creado${NC}"
    else
        echo -e "${GREEN}✅ Usando commits existentes${NC}"
    fi
else
    git commit -m "Initial commit: Ivy.AI Platform with multi-channel campaigns"
    echo -e "${GREEN}✅ Commit inicial creado${NC}"
fi
echo ""

# Paso 7: Configurar remote de GitHub
echo "📋 Paso 7: Configurando remote de GitHub..."
echo ""
echo -e "${YELLOW}📝 Instrucciones:${NC}"
echo "1. Ve a https://github.com/new"
echo "2. Crea un repositorio llamado 'ivy-ai-platform'"
echo "3. NO inicialices con README, .gitignore, o license"
echo "4. Copia la URL del repositorio"
echo ""
read -p "Ingresa la URL de tu repositorio GitHub (ej: https://github.com/usuario/ivy-ai-platform.git): " github_url

if [ -z "$github_url" ]; then
    echo -e "${RED}❌ URL no proporcionada${NC}"
    exit 1
fi

# Verificar si ya existe un remote llamado 'origin'
if git remote | grep -q "^origin$"; then
    echo -e "${YELLOW}⚠️  Remote 'origin' ya existe${NC}"
    read -p "¿Quieres reemplazarlo? (y/N): " replace_remote
    if [ "$replace_remote" = "y" ] || [ "$replace_remote" = "Y" ]; then
        git remote remove origin
        git remote add origin "$github_url"
        echo -e "${GREEN}✅ Remote 'origin' reemplazado${NC}"
    else
        echo -e "${GREEN}✅ Usando remote existente${NC}"
    fi
else
    git remote add origin "$github_url"
    echo -e "${GREEN}✅ Remote 'origin' agregado${NC}"
fi
echo ""

# Paso 8: Renombrar branch a main
echo "📋 Paso 8: Configurando branch principal..."
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    git branch -M main
    echo -e "${GREEN}✅ Branch renombrado a 'main'${NC}"
else
    echo -e "${GREEN}✅ Branch ya es 'main'${NC}"
fi
echo ""

# Paso 9: Push a GitHub
echo "📋 Paso 9: Pusheando a GitHub..."
echo -e "${YELLOW}⚠️  Esto subirá todo el código a GitHub${NC}"
read -p "¿Continuar? (y/N): " do_push

if [ "$do_push" = "y" ] || [ "$do_push" = "Y" ]; then
    git push -u origin main
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Código pusheado exitosamente a GitHub${NC}"
    else
        echo -e "${RED}❌ Error al pushear a GitHub${NC}"
        echo "Verifica tu URL de GitHub y credenciales"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Push cancelado${NC}"
    echo "Puedes pushear manualmente después con: git push -u origin main"
fi
echo ""

# Resumen final
echo "=========================================="
echo -e "${GREEN}🎉 ¡Setup de GitHub completado!${NC}"
echo "=========================================="
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. Ve a tu repositorio en GitHub:"
echo "   $github_url"
echo ""
echo "2. Verifica que todos los archivos estén presentes"
echo ""
echo "3. Configura Railway:"
echo "   - Ve a https://railway.app"
echo "   - Click en 'New Project'"
echo "   - Selecciona 'Deploy from GitHub repo'"
echo "   - Selecciona tu repositorio 'ivy-ai-platform'"
echo ""
echo "4. Sigue la guía completa en:"
echo "   GITHUB_RAILWAY_DEPLOYMENT.md"
echo ""
echo -e "${GREEN}✅ ¡Listo para deployment en Railway!${NC}"
echo ""
