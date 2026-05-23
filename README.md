# Bewerbungstracker – Docker Stack

## Projektstruktur

```
bewerbung/
├── docker-compose.yml       # Stack-Definition (Nginx + PHP + MariaDB)
├── nginx/
│   └── default.conf         # Nginx vHost-Konfiguration
├── php/
│   ├── Dockerfile           # PHP 8.3-FPM mit PDO MySQL
│   └── init.sql             # Datenbank + Tabelle anlegen
└── html/
    ├── index.html           # Frontend (Formular + Bewerbungsliste)
    └── api.php              # REST-API (GET/POST)
```

## Schnellstart

```bash
# Im Projektordner
docker compose up -d --build

# App aufrufen
open http://localhost:8080
```

## API-Endpunkte

| Methode | URL       | Beschreibung                        |
|---------|-----------|-------------------------------------|
| GET     | /api.php  | Alle Bewerbungen abrufen (JSON)     |
| POST    | /api.php  | Neue Bewerbung speichern (JSON-Body)|

### POST-Body (Pflichtfelder: `company`, `app_date`)

```json
{
  "company":          "Example",
  "app_date":         "2025-05-20",
  "jobtitle":         "AI Automation Engineer",
  "link":             "https://...",
  "status":           "Beworben",
  "contact_name":     "Max Muster",
  "contact_email":    "hr@firma.de",
  "contact_phone":    "+49 ...",
  "contact_position": "HR Manager",
  "notes":            "Interessantes Unternehmen, Remote möglich."
}
```

## Credentials ändern

In `docker-compose.yml` unter den `environment`-Blöcken von `php` und `mariadb`
sowie in `php/init.sql` (falls nötig).

## Daten zurücksetzen

```bash
docker compose down -v   # löscht auch das DB-Volume
docker compose up -d --build
```
