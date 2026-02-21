# Created with Sourcetable.com

from flask import Flask, render_template
import os

# Configuration minimale
app = Flask(__name__, template_folder='app/templates', static_folder='app/static')

@app.route('/')
def preview():
    # Données fictives pour le test
    return render_template('payment_by_student.html',
        student={
            'firstName': 'Jean', 'lastName': 'KOUASSI',
            'matricule': 'MAT-2024-001', 'classRoom': '6ème A',
            'totalFeesDue': 500000, 'totalFeesPaid': 350000
        },
        payments=[
            {'paymentDate': '2024-01-15', 'reference': 'REF001', 'method': 'Espèces', 'type': 'ENCAISSEMENT', 'amount': 100000},
            {'paymentDate': '2024-02-01', 'reference': 'REF002', 'method': 'Virement', 'type': 'ENCAISSEMENT', 'amount': 250000}
        ],
        current_date="14/02/2026"
    )

if __name__ == '__main__':
    print("Ouvrez http://localhost:5000 pour voir le design !")
    app.run(debug=True)