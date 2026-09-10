# Five Project Ideas

**Team:** Team 2  
**Week:** 1  


## Idea 1

- **Project name:** Nepali MedFinder
- **Target user:** Residents in smaller Nepali towns and local pharmacy owners.
- **Problem:** People waste hours calling around or physically visiting multiple pharmacies just to find out-of-stock medicines.
- **Smallest useful version:** A simple PWA where pharmacies can update stock via a basic form, and patients can search by medicine name to see which nearby pharmacy has it.
- **Midterm demo could show:** A patient searching for a specific medicine and seeing a list of two nearby dummy pharmacies that currently have it in stock.
- **Big risk / unknown:** The technology is easy, but the real challenge is pharmacy adoption—getting them to actually take the time to update their stock.

## Idea 2

- **Project name:** Himalayan Reserve Companion
- **Target user:** Coffee subscription customers in the diaspora (US) and locally (Nepal).
- **Problem:** Managing cross-border coffee subscriptions and telling the story of the coffee origins is difficult without dealing with slow App Store review times.
- **Smallest useful version:** A PWA where subscribers log in (JWT), view their next billing/delivery cycle, and read static markdown-based stories about the origin farm.
- **Midterm demo could show:** A user logging in, seeing their next Friday shipment date, and offline caching allowing them to read the farm story without internet.
- **Big risk / unknown:** Handling two completely different payment integrations later on (Stripe for US, eSewa/Khalti for Nepal).

## Idea 3

- **Project name:** CodeSecure
- **Target user:** Students and beginner developers.
- **Problem:** Beginners often unknowingly write insecure code (like hardcoding API keys or SQL injections) and don't know how to test for it before deploying.
- **Smallest useful version:** A web app where a user uploads a code snippet, and the system runs a basic scan to flag hardcoded secrets and generates a simple explanation report.
- **Midterm demo could show:** Uploading a Python file with a fake API key, and the app instantly generating a security score and highlighting the exact line with the vulnerability.
- **Big risk / unknown:** Accurately analyzing complex code files without throwing too many "false positive" errors that confuse beginners.

## Idea 4

- **Project name:** ArtMarket Hub
- **Target user:** Digital artists and buyers looking for custom commissions or courses.
- **Problem:** Artists currently have to split their presence across multiple platforms to host portfolios, sell digital art, teach courses, and manage custom commissions.
- **Smallest useful version:** A platform where an artist can create a profile, upload a portfolio gallery, and list one commission service with a set price.
- **Midterm demo could show:** A buyer viewing an artist's portfolio and clicking a "Request Commission" button to send an inquiry form.
- **Big risk / unknown:** Handling the complex workflow of a custom commission (drafts, revisions, and final delivery) might be too big for the MVP.

## Idea 5

- **Project name:** Syllabus to Calendar
- **Target user:** College students at the very start of the semester.
- **Problem:** Students manually type 50 different due dates into their calendars, which takes forever and leads to missed assignments.
- **Smallest useful version:** A web tool where a student pastes the raw text of a syllabus, and it extracts the dates to generate a downloadable `.ics` Calendar file.
- **Midterm demo could show:** Pasting a short syllabus paragraph with three assignment dates, and the app downloading a file that instantly populates Google Calendar.
- **Big risk / unknown:** Every professor formats their syllabus completely differently, so extracting dates accurately from weird text might be difficult.
