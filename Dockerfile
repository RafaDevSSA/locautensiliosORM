FROM nginx:1.29.0

RUN apt-get update \
    && apt-get install -y bash \
    && rm -rf /var/lib/apt/lists/*

COPY ./html /usr/share/nginx/html

# Opcional: Copiar configuração customizada do nginx
# COPY ./nginx.conf /etc/nginx/nginx.conf

# Expor a porta 80
EXPOSE 80


# O nginx já roda automaticamente com a imagem base
# Comando padrão: nginx -g 'daemon off;'