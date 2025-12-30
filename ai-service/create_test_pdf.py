from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def create_pdf(filename, text):
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter
    c.drawString(100, height - 100, text)
    c.save()

if __name__ == "__main__":
    create_pdf("valid_test.pdf", "This is a valid PDF document created for testing RAG extraction.")
    print("Created valid_test.pdf")
