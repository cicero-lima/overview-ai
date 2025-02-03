from flask import Flask, jsonify, request
from flask_cors import CORS  # Importação do CORS
import psycopg2
import os

app = Flask(__name__)
CORS(app)  # Habilita CORS para todas as rotas

DB_URI = os.getenv('DATABASE_URL', 'postgresql://neondb_owner:npg_MTe4n2FabQkP@ep-gentle-math-a5rqxjrr-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require')

def get_db_connection():
    return psycopg2.connect(DB_URI)

def ensure_table_exists():
    """Cria a tabela detection_boxes caso ela não exista."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    create_table_query = """
    CREATE TABLE IF NOT EXISTS detection_boxes (
        id SERIAL PRIMARY KEY,
        height FLOAT NOT NULL,
        "left" FLOAT NOT NULL, 
        top FLOAT NOT NULL,
        width FLOAT NOT NULL,
        class_name TEXT NOT NULL,
        confidence FLOAT NOT NULL
    );
    """
    
    cursor.execute(create_table_query)
    conn.commit()
    cursor.close()
    conn.close()


@app.route('/get-detection-boxes', methods=['GET'])
def get_detection_boxes():
    ensure_table_exists()  # Garante que a tabela exista

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = 'SELECT height, "left", top, width, class_name, confidence FROM detection_boxes LIMIT 10;'

        cursor.execute(query)
        detection_boxes = cursor.fetchall()

        boxes = [{
            "height": box[0],
            "left": box[1],
            "top": box[2],
            "width": box[3],
            "class_name": box[4],
            "confidence": box[5]
        } for box in detection_boxes]

        cursor.close()
        conn.close()

        return jsonify(boxes)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/add-detection-box', methods=['POST'])
def insert_detection_box():
    ensure_table_exists()  # Garante que a tabela exista antes de inserir dados

    try:
        data = request.get_json()

        # Validação básica dos campos esperados
        required_fields = ["height", "left", "top", "width", "class_name", "confidence"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Todos os campos são obrigatórios: " + ", ".join(required_fields)}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
        INSERT INTO detection_boxes (height, "left", top, width, class_name, confidence)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id;
        """

        cursor.execute(query, (data["height"], data["left"], data["top"], data["width"], data["class_name"], data["confidence"]))
        
        new_id = cursor.fetchone()[0]  # Obtém o ID do novo registro inserido
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"message": "Caixa de detecção adicionada!", "id": new_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

