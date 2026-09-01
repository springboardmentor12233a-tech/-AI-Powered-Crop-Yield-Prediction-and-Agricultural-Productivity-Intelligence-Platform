import psycopg2

connection = psycopg2.connect(
    host="localhost",
    database="yieldsense",
    user="postgres",
    password="sri",
    port="5432"
)

print("PostgreSQL connected successfully!")