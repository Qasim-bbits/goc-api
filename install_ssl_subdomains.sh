#!/bin/bash

# Define parent domain
PARENT_DOMAIN="bbits.solutions"

# Remove \r characters from subdomains.txt and replace spaces with newlines
sed -i -e 's/\r//g' -e 's/ /\n/g' subdomains.txt

# Read subdomains from file into an array
IFS=$'\n' read -d '' -r -a SUBDOMAINS < subdomains.txt

# Install Certbot and Nginx if not already installed
sudo apt-get update
sudo apt-get install -y certbot nginx

# Function to obtain SSL certificate for a domain
obtain_ssl_certificate() {
    local DOMAIN="$1.$PARENT_DOMAIN"
    sudo certbot certonly --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email ahsan@bbits.solutions
}

# Iterate over subdomains and obtain SSL certificates
for SUBDOMAIN in "${SUBDOMAINS[@]}"; do
    obtain_ssl_certificate "$SUBDOMAIN"
done

# Update Nginx configuration for each subdomain
for SUBDOMAIN in "${SUBDOMAINS[@]}"; do
    # Update server block configuration
    sudo tee "/etc/nginx/sites-available/$SUBDOMAIN.$PARENT_DOMAIN" > /dev/null <<EOF
server {
    root /var/www/html;

    # Add index.php to the list if you are using PHP
    index index.php index.html index.htm;

    server_name $SUBDOMAIN.$PARENT_DOMAIN;

    location /api {
        proxy_pass "http://127.0.0.1:3000";
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }

    location /uploads {
        alias /var/www/html/ventra/uploads;
        # Additional configuration options can go here
    }

    location / {
        try_files \$uri \$uri/ /index.html\$is_args\$args;
    }

    # pass PHP scripts to FastCGI server
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.2-fpm.sock;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/$SUBDOMAIN.$PARENT_DOMAIN/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/$SUBDOMAIN.$PARENT_DOMAIN/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if (\$host = $SUBDOMAIN.$PARENT_DOMAIN) {
        return 301 https://\$host\$request_uri;
    } # managed by Certbot

    listen 80;
    server_name $SUBDOMAIN.$PARENT_DOMAIN;
    return 404; # managed by Certbot
}
EOF

    # Enable the site
    sudo ln -s "/etc/nginx/sites-available/$SUBDOMAIN.$PARENT_DOMAIN" "/etc/nginx/sites-enabled/"
done

# Verify Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Add a cron job for automatic renewal of SSL certificates
(crontab -l ; echo "0 0 * * * certbot renew --quiet") | crontab -
