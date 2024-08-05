# Software Engineer (Node.js) - Technical Assessment

## Overview

An E-commerce platform

## Objectives

1. Microservices: implement individual microservices
2. Real-time Auction: Develop real-time auction system using socket.io, where users can bid on products
3. Notification: ensure users receive notifications for various activities through an in-app message box
4. Auth & Auth: implement JWT-based authentication and role-based access control
5. Caching and Queuing: utilize redis for caching frequently accessed data and queuing messages
6. DevOps practices: containerize the application using docker. set up ci/cd using Github actions

## Deliverables

1. User Service:
   a. User registration, login and profile management
   b. JWT-based auth
2. Admin Service:
   a. Admin functionalities for managing users and products
   b. Role-based access control to secure endpoints
3. Product Service:
   a. Product lifecycle management, including adding products for auction
   b. Integration with real-time auction system
4. Order Service:
   a. Order processing and management
   b. Recording auction results as orders
5. Auction Service:
   a. Real-time auction functionalities using socket.io
   b. Notification to users for auction events.
6. Integration and Deployment:
   a. Docker containerization
   b. CI/CD pipeline setup using Github Actions.

## Microservices and Tasks:

1. User Service:
   Requirements: - User registration (POST /users/register) - User login (POST /user/login) - User profile management (GET /users/profile, PUT /users/profile)
   Endpoints: POST /users/register, POST /users/login, GET /users/profile, PUT /users/profile
   Authentication: - JWT-based authentication
2. Admin Service:
   Requirements: - Admin functionalities such as managing users and products - Authorization to ensure only admins can access certain endpoints
   Endpoints: GET /admin/users, PUT /admin/users/:id, DELETE /admin/users/:id, GET (POST was written, but I'm assuming typo?) /admin/products, PUT /admin/products/:id, DELETE /admin/products/:id
3. Product Service:
   Requirements: - Manage Product lifecycle - Add products to auction with starting price and auction time
   Endpoints: POST /products, GET /products, GET /products/:id, PUT /products/:id, DELETE /products/:id
4. Order Service:
   Requirements: - Manage user orders - Record auction results as orders
   Endpoints: POST /orders, GET /orders, GET /orders/:id, PUT /orders/:id, DELETE /orders/:id
5. Auction Service:
   Requirements: - Real-time auction using Socket.io - Notify users when a product is up for auction and track auction bids
   Implementation Details: - use socket.io for real-time communication - integrate redis for caching and message queuing

## Potential System Improvements

- Add email verification for users
- Implement/integrate an image service, to support images for products (and possibly user profiles)
- Auction systems typically extend their end time if a bid is made within a short time to their end. This could be a useful addition to the system.
- Before implementing bid deleting, the application may benefit from a user reporting system, to help identify suspicious/malicious behaviour (e.g. making large bids on auctions only to delete the bid near the end, i.e. scaring off other bidders without any intention to order).
- Store auction events emitted in socket rooms as notifications for relevant users.
