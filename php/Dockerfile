FROM php:8.3-fpm-alpine

# Install PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql

# Install mysqli as well
RUN docker-php-ext-install mysqli

# Clean up
RUN rm -rf /var/cache/apk/*

WORKDIR /var/www/html
