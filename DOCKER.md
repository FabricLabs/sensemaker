# Sensemaker Docker Setup Guide

This guide will help you set up Sensemaker using Docker Compose, which provides a complete containerized environment with all necessary services.

## Prerequisites

- Docker Engine 20.10.0 or higher
- Docker Compose 2.0.0 or higher
- At least 4GB RAM available for containers
- At least 10GB disk space for models and data

## Quick Start

1. **Clone the repository** (if not already done):
   ```bash
   git clone https://github.com/FabricLabs/sensemaker.git
   cd sensemaker
   ```

2. **Copy the environment template**:
   ```bash
   cp .env.template .env
   ```

3. **Start the services**:
   ```bash
   docker-compose up -d
   ```

4. **Wait for services to be ready** (this may take several minutes):
   ```bash
   docker-compose logs -f sensemaker
   ```

5. **Set up Ollama models** (in a separate terminal):
   ```bash
   docker-compose exec ollama ./scripts/setup-ollama-models.sh
   ```

6. **Access the web interface**:
   Open your browser and navigate to `http://localhost:3040`

## Services Overview

The Docker Compose setup includes the following services:

### MySQL Database
- **Container**: `sensemaker_mysql`
- **Port**: 3306
- **Database**: `db_sensemaker`
- **User**: `db_user_sensemaker`
- **Password**: `sensemaker_password`

### Redis Stack
- **Container**: `sensemaker_redis`
- **Port**: 6379
- **Features**: Redis with modules for vector search and JSON support

### Ollama
- **Container**: `sensemaker_ollama`
- **Port**: 11434
- **Models**: llama3.2:1b, qwen2.5:0.5b (lightweight models for containers)

### Sensemaker Application
- **Container**: `sensemaker_app`
- **Port**: 3040
- **Web Interface**: http://localhost:3040

## Configuration

### Environment Variables

Edit the `.env` file to customize your setup:

```env
# Database Configuration
SQL_DB_HOST=mysql
SQL_DB_USERNAME=db_user_sensemaker
SQL_DB_PASSWORD=sensemaker_password

# Redis Configuration
REDIS_HOST=redis

# Ollama Configuration
OLLAMA_HOST=ollama
OLLAMA_PORT=11434

# Optional API Keys
OPENAI_API_KEY=your_openai_key_here
GITHUB_TOKEN=your_github_token_here
```

### Custom Settings

You can customize application settings by modifying `settings/docker.js` or by mounting your own settings file:

```yaml
# Add to docker-compose.yml under sensemaker service volumes:
volumes:
  - ./my-custom-settings.js:/app/settings/docker.js
```

## Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f sensemaker
docker-compose logs -f mysql
docker-compose logs -f redis
docker-compose logs -f ollama
```

### Access Container Shell
```bash
# Sensemaker application
docker-compose exec sensemaker bash

# MySQL database
docker-compose exec mysql mysql -u db_user_sensemaker -p db_sensemaker

# Redis
docker-compose exec redis redis-cli
```

### Restart Services
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart sensemaker
```

## Ollama Model Management

### Pull Additional Models
```bash
# Access Ollama container
docker-compose exec ollama bash

# Pull a specific model
ollama pull llama3.2:3b

# List available models
ollama list
```

### Supported Models
The Docker setup is configured for lightweight models suitable for containers:
- `llama3.2:1b` - Fast, lightweight model
- `qwen2.5:0.5b` - Very small, efficient model

For more powerful models, ensure you have sufficient RAM and disk space:
- `llama3.2:3b` - Medium-sized model (requires ~4GB RAM)
- `llama3.1:8b` - Larger model (requires ~8GB RAM)

## Data Persistence

Data is persisted using Docker volumes:
- `mysql_data`: MySQL database files
- `redis_data`: Redis data files
- `ollama_data`: Ollama models and data
- `app_storage`: Application files and uploads

To backup your data:
```bash
docker-compose down
docker run --rm -v sensemaker_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz /data
```

## Troubleshooting

### Services Not Starting
1. Check if ports are available:
   ```bash
   netstat -tuln | grep -E '(3040|3306|6379|11434)'
   ```

2. Check container logs:
   ```bash
   docker-compose logs sensemaker
   ```

3. Verify Docker resources:
   ```bash
   docker system df
   docker system prune  # If needed
   ```

### Database Connection Issues
1. Check MySQL container health:
   ```bash
   docker-compose exec mysql mysqladmin ping -h localhost
   ```

2. Verify database credentials:
   ```bash
   docker-compose exec mysql mysql -u db_user_sensemaker -p
   ```

### Ollama Model Issues
1. Check if Ollama is running:
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. Pull models manually:
   ```bash
   docker-compose exec ollama ollama pull llama3.2:1b
   ```

### Application Not Responding
1. Check application logs:
   ```bash
   docker-compose logs -f sensemaker
   ```

2. Verify all services are healthy:
   ```bash
   docker-compose ps
   ```

3. Restart the application:
   ```bash
   docker-compose restart sensemaker
   ```

## Testing Message Responses

Once everything is running, you can test the system:

1. **Web Interface**: Navigate to `http://localhost:3040`
2. **API Testing**: Use curl to test the API endpoints
3. **Chat Interface**: Use the web interface to send messages and verify responses

### Example API Test
```bash
# Check service status
curl http://localhost:3040/api/status

# Send a test message (if API endpoint exists)
curl -X POST http://localhost:3040/api/messages \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, Sensemaker!"}'
```

## Performance Optimization

### Memory Usage
- Monitor container memory usage: `docker stats`
- Adjust model selection based on available RAM
- Consider using smaller models for development

### Storage
- Regularly clean up unused Docker images: `docker image prune`
- Monitor volume usage: `docker system df`

### Network
- Use Docker networks for service communication
- Consider using Docker Swarm for production deployments

## Development

For development with Docker:

1. **Mount source code**:
   ```yaml
   # Add to docker-compose.yml under sensemaker service
   volumes:
     - .:/app
     - /app/node_modules  # Preserve node_modules
   ```

2. **Enable development mode**:
   ```env
   NODE_ENV=development
   DEBUG=true
   ```

3. **Use nodemon for auto-restart**:
   ```dockerfile
   # In Dockerfile.app
   RUN npm install -g nodemon
   CMD ["nodemon", "scripts/docker-node.js"]
   ```

## Security

### Production Considerations
- Change default passwords in `.env`
- Use Docker secrets for sensitive data
- Enable TLS/SSL for external access
- Regular security updates for base images

### Network Security
- Use Docker networks to isolate services
- Implement proper firewall rules
- Consider using a reverse proxy (nginx, traefik)

## Backup and Recovery

### Database Backup
```bash
docker-compose exec mysql mysqldump -u db_user_sensemaker -p db_sensemaker > backup.sql
```

### Full System Backup
```bash
docker-compose down
docker run --rm -v sensemaker_mysql_data:/mysql -v sensemaker_redis_data:/redis -v sensemaker_ollama_data:/ollama -v $(pwd):/backup alpine tar czf /backup/sensemaker_backup.tar.gz /mysql /redis /ollama
```

## Support

If you encounter issues:
1. Check this documentation
2. Review container logs
3. Check the main project documentation
4. Open an issue on GitHub

## Contributing

To contribute to the Docker setup:
1. Test changes with `docker-compose up --build`
2. Update documentation as needed
3. Submit pull requests with clear descriptions