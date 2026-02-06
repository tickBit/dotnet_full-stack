# Full-stack: React frontend & .NET backend

Käyttäjiä voi rekisteröidä ja kirjata sisään. Kirjautunut käyttäjä voi kirjoittaa muistiinpanoja, uusin ilmestyy ensimmäisenä. Käyttäjä voi tuhota tilinsä.

Muistiinpanoa voi muokata klikkaamalla kynää. Muistiinpano tallennetaan painamalla sitten returnia. Jollei halua tallentaa muistiinpanoa, niin klikkaamalla kynää uudelleen palaudutaan muokkaustilasta.

Roskakoria klikkaamalla voi poistaa muistiinpanon. Alasvetovalikosta voidaan valita muistiinpanojen määrä sivulla (ja siten montako haetaan backendin kautta kerralla).

Sovelluksessa on sivutus (engl. pagination).

"My Account":ia klikkaamalla kirjautuneena tulee menu, jossa "Profile" ja "Logout".

16.1.2026 alkaen token kestää yhden tunnin, minkä jälkeen käyttäjä kirjataan ulos.

HUOM! Selaimen Local Storage on syytä tarvittaessa tyhjentää `http://localhost:3000` kohdalta aluksi.

## Tämä projekti sisältää

- .NET 10 Minimal API backendin (C#)
- React frontendin
- MS SQL Server -tietokannan (LocalDB)
- JWT-autentikoinnin (login, register, protected routes)
- Entity Framework Core -migrations

## **Käynnistys**

### **Vaatimukset**

- .NET 10 SDK  
- toimii ainakin SQL Server Express LocalDB:llä
- Node.js (frontendin käynnistämiseen)

### **1. Backendin käynnistys**

Siirry backend-projektin juureen:

1.1 Asenna riippuvuudet

`dotnet restore`
`dotnet tool install --global dotnet-ef`

1.2 Aja tietokantamigraatiot LocalDB:lle:

`dotnet ef migrations add InitialCreate`
`dotnet ef database update`

1.3 Käynnistä backend

`dotnet run`

### **2. Frontendin käynnistys**

- siirry frontend-hakemistoon
- `npm install`
- `npm start`

#### Muuta

Tarvitaan `.env`-tiedosto, jota ei luonnollisesti tule sisällyttää GitHubiin. Ohessa esimerkkiarvot sovellusta varten:

JWT_KEY=SUPER_SECRET_KEY_123_FOR_MY_AND_EVERYONE_ELSES_EYES_ONLY

JWT_ISSUER=AuthApi

JWT_AUDIENCE=AuthApi

DEFAULT_CONNSTRING=Server=(localdb)\MSSQLLocalDB;Database=AuthApiDb;Trusted_Connection=True;


#### Kuva

![Note-demo](https://github.com/user-attachments/assets/020763a2-13fc-4d69-8a3b-4976f24195ea)

Paranneltu menu klikattu näkyviin.



