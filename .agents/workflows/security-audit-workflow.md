# Tietoturva-auditointi (Security Audit Workflow)

Tämä työnkulku on tarkoitettu ajettavaksi projektin kriittisissä vaiheissa, esimerkiksi ennen tuotantoon siirtymistä (Go-Live) tai merkittävien arkkitehtuurimuutosten jälkeen. Sen tarkoituksena on etsiä ja raportoida projektin tietoturvapuutteita systemaattisesti.

Kun käyttäjä pyytää: *"Aja tietoturvatarkastus"*, *"Tee security audit"* tai nimeää tämän tiedoston, toimi seuraavasti:

## Vaihe 1: Koodipohjan staattinen analyysi
Tekoälyagentti käy läpi projektin rakenteen ja lähdekoodin keskittyen seuraaviin osa-alueisiin:

1. **Autentikaatio ja API-suojaus:**
   - Onko jokaisessa API-reitissä (API routes / Server Actions) asianmukainen tarkistus sille, että käyttäjä on kirjautunut sisään?
   - Ovatko roolipohjaiset oikeudet (RBAC) toteutettu oikein?
   - Etsi IDOR (Insecure Direct Object Reference) -riskejä: varmistetaanko resurssien haussa (esim. tietokantakyselyissä), että data kuuluu varmasti pyynnön tekijälle?

2. **Datan vuotaminen (Data Exposure):**
   - Palauttavatko tietokantakyselyt liikaa dataa käyttöliittymään (esim. salasanojen hashit, sisäiset ID:t tai piilotetut kentät)?

3. **Ympäristömuuttujat ja salaisuudet:**
   - Etsi kovakoodattuja salaisuuksia (API-avaimet, salasanat) lähdekoodista.
   - Varmista, että mikään salainen ympäristömuuttuja ei ole vahingossa vuotamassa frontendin puolelle (esim. Next.js:ssä väärin nimettynä `NEXT_PUBLIC_` -alkuiseksi).

4. **Käyttäjän syötteiden validointi (Input Validation & XSS):**
   - Validoidaanko lomakkeiden ja API:n saamat tiedot tiukasti (esim. Zod-kirjastolla) ennen tietokantaan tallentamista?
   - Onko riskiä tietokantainjektioille tai Cross-Site Scripting (XSS) -haavoittuvuudelle?

## Vaihe 2: Infran ja konfiguraation tarkistus
Tarkista projektin asetustiedostot:
- Onko CORS (Cross-Origin Resource Sharing) määritetty turvallisesti tuotantoa varten (ettei se salli kaikkia alkuperiä `*`)?
- Ovatko HTTP Security Headers (esim. Content-Security-Policy, Strict-Transport-Security) asetettu `next.config.ts` -tiedostossa?
- Varoita, jos puuttuu Rate Limiting, erityisesti kirjautumisreiteistä tai raskaista API-endpointteista (jotta vältetään DoS- ja brute force -hyökkäykset).

## Vaihe 3: Raportointi ja Toimenpiteet
Luo ja näytä käyttäjälle kattava **Walkthrough**-raportti tai erillinen `security-report.md` -tiedosto löydöksistä.
Jaottele löydökset vakavuusasteittain:

- 🔴 **Kriittinen (Critical):** Vaatii välitöntä korjausta ennen tuotantoon menoa (esim. puuttuva autentikaatio kriittisestä reitistä, salaisuuksien vuotaminen).
- 🟡 **Varoitus (Warning):** Suositeltu korjaus tai parannuskohde (esim. puuttuva Rate Limiting, puutteelliset Security Headerit).
- 🟢 **Kunnossa (Pass):** Asiat, jotka on toteutettu oikein ja noudattavat parhaita käytäntöjä.

Kysy käyttäjältä raportin esittämisen jälkeen: *"Haluatko, että korjaan nämä kriittiset puutteet heti?"*
