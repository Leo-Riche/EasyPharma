from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
import os

OUTPUT = os.path.join(os.path.dirname(__file__), "ordonnance_test2.pdf")

def draw_ordonnance():
    c = canvas.Canvas(OUTPUT, pagesize=A4)
    W, H = A4

    GREEN = colors.HexColor("#16a34a")
    DARK  = colors.HexColor("#0f172a")
    GRAY  = colors.HexColor("#64748b")
    LIGHT = colors.HexColor("#f0fdf4")
    BORDER= colors.HexColor("#bbf7d0")

    # Header strip
    c.setFillColor(LIGHT)
    c.rect(0, H - 52*mm, W, 52*mm, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.rect(0, H - 54*mm, W, 2*mm, fill=1, stroke=0)

    # Logo
    c.setFillColor(GREEN)
    c.roundRect(14*mm, H - 22*mm, 8*mm, 8*mm, 1.5*mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setStrokeColor(colors.white)
    c.setLineWidth(1.8)
    c.line(18*mm, H - 16.5*mm, 18*mm, H - 21.5*mm)
    c.line(15.5*mm, H - 19*mm, 20.5*mm, H - 19*mm)

    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(24*mm, H - 19.5*mm, "EasyPharma")
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 8)
    c.drawString(24*mm, H - 23.5*mm, "Reseau de pharmacies connectees")

    # Medecin
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(14*mm, H - 32*mm, "Dr. Philippe RENARD")
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 9)
    c.drawString(14*mm, H - 37*mm, "Endocrinologue - RPPS 10007891234")
    c.drawString(14*mm, H - 41.5*mm, "8 Avenue de l'Opera, 75001 Paris")
    c.drawString(14*mm, H - 46*mm, "Tel : 01 47 03 87 20")

    # Date
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawRightString(W - 14*mm, H - 32*mm, "Paris, le 11 juin 2026")
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 9)
    c.drawRightString(W - 14*mm, H - 37*mm, "Ordonnance n* 2026-06-0198")

    # Titre
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(W / 2, H - 64*mm, "ORDONNANCE MEDICALE")
    c.setFillColor(GREEN)
    c.rect(W/2 - 30*mm, H - 66.5*mm, 60*mm, 0.5*mm, fill=1, stroke=0)

    # Patient
    c.setFillColor(LIGHT)
    c.roundRect(14*mm, H - 84*mm, W - 28*mm, 14*mm, 2*mm, fill=1, stroke=0)
    c.setStrokeColor(BORDER)
    c.setLineWidth(1)
    c.roundRect(14*mm, H - 84*mm, W - 28*mm, 14*mm, 2*mm, fill=0, stroke=1)
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 8)
    c.drawString(18*mm, H - 73.5*mm, "PATIENT")
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(18*mm, H - 79*mm, "Mme. Claire LEBLANC")
    c.setFont("Helvetica", 9)
    c.setFillColor(GRAY)
    c.drawString(72*mm, H - 79*mm, "Nee le 22/09/1965  |  Securite Sociale : 2 65 09 75 042 118 24")

    # Medications
    meds = [
        {
            "num": "1",
            "name": "Levothyrox 50µg",
            "detail": "Levothyroxine sodique 50 microgrammes - comprime",
            "posologie": "1 comprime le matin a jeun, 30 minutes avant le petit-dejeuner",
            "duree": "3 mois",
            "qty": "3 boites de 30 comprimes",
        },
        {
            "num": "2",
            "name": "Metformine 850mg",
            "detail": "Metformine chlorhydrate 850 mg - comprime",
            "posologie": "1 comprime matin et soir au cours des repas",
            "duree": "3 mois",
            "qty": "2 boites de 90 comprimes",
        },
        {
            "num": "3",
            "name": "Xarelto 20mg",
            "detail": "Rivaroxaban 20 mg - comprime pellicule",
            "posologie": "1 comprime par jour au cours du repas du soir",
            "duree": "1 mois",
            "qty": "1 boite de 28 comprimes",
        },
    ]

    y = H - 92*mm

    for med in meds:
        c.setFillColor(colors.white)
        c.setStrokeColor(BORDER)
        c.setLineWidth(1)
        c.roundRect(14*mm, y - 22*mm, W - 28*mm, 22*mm, 2*mm, fill=1, stroke=1)

        c.setFillColor(GREEN)
        c.circle(20*mm, y - 7*mm, 3.5*mm, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(20*mm, y - 9*mm, med["num"])

        c.setFillColor(DARK)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(26*mm, y - 7.5*mm, med["name"])

        c.setFillColor(GRAY)
        c.setFont("Helvetica", 8.5)
        c.drawString(26*mm, y - 12.5*mm, med["detail"])

        c.setFillColor(DARK)
        c.setFont("Helvetica", 9)
        c.drawString(26*mm, y - 17*mm, "Posologie : " + med["posologie"])

        c.setFillColor(GRAY)
        c.setFont("Helvetica", 8.5)
        c.drawString(26*mm, y - 21*mm, "Duree : " + med["duree"] + "   |   Quantite : " + med["qty"])

        y -= 26*mm

    # Note
    c.setFillColor(colors.HexColor("#fffbeb"))
    c.setStrokeColor(colors.HexColor("#fde68a"))
    c.roundRect(14*mm, y - 10*mm, W - 28*mm, 10*mm, 2*mm, fill=1, stroke=1)
    c.setFillColor(colors.HexColor("#92400e"))
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(18*mm, y - 4*mm, "NON SUBSTITUABLE")
    c.setFont("Helvetica", 8.5)
    c.drawString(55*mm, y - 4*mm, "Les medicaments prescrits ne doivent pas etre substitues.")
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.HexColor("#b45309"))
    c.drawString(18*mm, y - 8*mm, "Mention apposee conformement a l'article R.5125-54 du CSP")

    y -= 16*mm

    # Signature
    c.setStrokeColor(BORDER)
    c.setLineWidth(1)
    c.line(W - 70*mm, y, W - 14*mm, y)
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 8)
    c.drawCentredString(W - 42*mm, y - 5*mm, "Signature et cachet du medecin")
    c.setFillColor(DARK)
    c.setFont("Helvetica-BoldOblique", 10)
    c.drawCentredString(W - 42*mm, y - 14*mm, "Dr. P. Renard")

    # Footer
    c.setFillColor(GREEN)
    c.rect(0, 12*mm, W, 0.5*mm, fill=1, stroke=0)
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(W/2, 8*mm, "Document genere via EasyPharma  |  Conservez cette ordonnance - valable 3 mois")
    c.drawCentredString(W/2, 4.5*mm, "En cas d'urgence : 15 (SAMU)  |  17 (Police)  |  18 (Pompiers)  |  114 (Malentendants)")

    c.save()
    print(f"Generated: {OUTPUT}")

draw_ordonnance()
