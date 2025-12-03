# Full-stack: React frontend & .NET backend

## Tämä projekti sisältää

- .NET 10 Minimal API backendin (C#)
- React-frontendin
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

1.2 Aja tietokantamigraatiot

LocalDB:lle:

`dotnet ef database update`

1.3 Käynnistä backend

`dotnet run`

### **2. Frontendin käynnistys**

- siirry frontend-hakemistoon
- aja komento `npm start`

#### Muuta

Taisinpa tehdä 1. kerran hieman yleiskäyttöisemmän dialogi-komponentin fronttiin.
