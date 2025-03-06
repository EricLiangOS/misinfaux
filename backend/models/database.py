import json
import os

class ArticleDatabase:
    def __init__(self, db_path='articles_db.json'):
        self.db_path = db_path
        self._ensure_db_exists()
        
    def _ensure_db_exists(self):
        if not os.path.exists(self.db_path):
            with open(self.db_path, 'w') as f:
                json.dump({
                    'reliable': [],
                    'unreliable': []
                }, f)
    
    def add_article(self, text, is_reliable):
        with open(self.db_path, 'r') as f:
            db = json.load(f)
        
        category = 'reliable' if is_reliable else 'unreliable'
        db[category].append(text)
        
        with open(self.db_path, 'w') as f:
            json.dump(db, f)
    
    def get_reliable_corpus(self):
        with open(self.db_path, 'r') as f:
            db = json.load(f)
        return db.get('reliable', [])
    
    def get_unreliable_corpus(self):
        with open(self.db_path, 'r') as f:
            db = json.load(f)
        return db.get('unreliable', [])