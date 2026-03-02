from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
import os
from datetime import datetime

app = FastAPI(title="Report Service", version="1.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup Jinja2 templates
templates_dir = os.path.join(os.path.dirname(__file__), "templates")
env = Environment(loader=FileSystemLoader(templates_dir))

class InvoiceItem(BaseModel):
    description: str
    amount: float

class InvoiceData(BaseModel):
    invoice_number: str
    date: str
    student_name: str
    student_id: str
    items: list[InvoiceItem]
    total_amount: float
    paid_amount: float
    balance_due: float
    payment_method: str = "CASH"

@app.get("/")
def read_root():
    return {"status": "Report Service Operational"}

@app.post("/generate-invoice")
async def generate_invoice(data: InvoiceData):
    try:
        template = env.get_template("invoice.html")
        
        # Render HTML with data
        html_content = template.render(
            invoice_number=data.invoice_number,
            date=data.date,
            student_name=data.student_name,
            student_id=data.student_id,
            items=data.items,
            total=data.total_amount,
            paid=data.paid_amount,
            balance=data.balance_due,
            method=data.payment_method,
            generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        
        # Convert to PDF
        pdf_bytes = HTML(string=html_content).write_pdf()
        
        return Response(content=pdf_bytes, media_type="application/pdf", headers={
            "Content-Disposition": f"attachment; filename=invoice_{data.invoice_number}.pdf"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))