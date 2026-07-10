from sqlalchemy import (
    Column, String, Boolean, Integer, Numeric, Text,
    TIMESTAMP, JSON, ForeignKey, func, Index,
)
from sqlalchemy.orm import relationship
from database import Base


class Betrieb(Base):
    __tablename__ = "betriebe"

    place_id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    adresse = Column(String)
    plz = Column(String)
    ort = Column(String)
    kanton = Column(String)
    telefon = Column(String)
    email = Column(String)
    website_url = Column(String)
    website_domain = Column(String)
    keine_website = Column(Boolean, default=False)

    google_rating = Column(Numeric(3, 1))
    google_anzahl = Column(Integer)
    oeffnungszeiten = Column(JSON)
    koordinaten = Column(JSON)
    google_reviews_raw = Column(JSON)

    name_anzeige = Column(String)
    inhaber_name = Column(String)
    farbe_primary = Column(String)
    hat_logo = Column(Boolean)
    logo_url = Column(String)
    firmenprofil = Column(Text)
    extrahiert_am = Column(TIMESTAMP(timezone=True))

    slug = Column(String, unique=True)
    landing_url = Column(String)
    landing_generiert_am = Column(TIMESTAMP(timezone=True))

    outreach_status = Column(String)
    email_status = Column(String, default="unbekannt")
    optout = Column(Boolean, default=False)
    letzter_kontakt_am = Column(TIMESTAMP(timezone=True))

    status = Column(String, default="entdeckt")
    branche = Column(String)
    fehler_log = Column(Text)
    entdeckt_am = Column(TIMESTAMP(timezone=True), server_default=func.now())

    kontaktversuche = relationship(
        "Kontaktversuch", back_populates="betrieb", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_betriebe_status", "status"),
        Index("ix_betriebe_website_domain", "website_domain"),
    )


class Kontaktversuch(Base):
    __tablename__ = "kontaktversuche"

    id = Column(Integer, primary_key=True, autoincrement=True)
    place_id = Column(String, ForeignKey("betriebe.place_id", ondelete="CASCADE"))
    typ = Column(String)
    email_adresse = Column(String)
    email_subject = Column(String)
    email_text = Column(Text)
    gesendet_am = Column(TIMESTAMP(timezone=True))

    betrieb = relationship("Betrieb", back_populates="kontaktversuche")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    typ = Column(String)
    gestartet_am = Column(TIMESTAMP(timezone=True), server_default=func.now())
    abgeschlossen_am = Column(TIMESTAMP(timezone=True))
    status = Column(String, default="laufend")
    total = Column(Integer)
    verarbeitet = Column(Integer, default=0)
    fehler = Column(Integer, default=0)
    log = Column(Text, default="")
