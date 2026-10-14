import sqlite3

def init_db():
    conn = sqlite3.connect('app.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT NOT NULL,
            crop TEXT NOT NULL,
            predictedYield REAL NOT NULL,
            date TEXT NOT NULL,
            formData TEXT NOT NULL,
            advisory_report TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT NOT NULL,
            userName TEXT NOT NULL,
            text TEXT NOT NULL,
            response TEXT,
            date TEXT NOT NULL
        )
    ''')
    
    # Check if admin exists
    c.execute("SELECT * FROM users WHERE email='admin123@gmail.com'")
    if not c.fetchone():
        c.execute("INSERT INTO users (name, email, password, role) VALUES ('System Admin', 'admin123@gmail.com', 'admin123', 'admin')")
    
    conn.commit()
    conn.close()

init_db()
