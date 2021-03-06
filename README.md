
# Widget-tableau-portal

A little sample showing a page to embed and organise Tableau Sheets and/or Dashboards in a widget grid.

You can:
- Add widget by pasting the embed code from Tableau Online, Tableau Public or Tableau Server
- Move and resize Widget (better to use "automatic" layout in Dashboard)
- Synchronise Filters across Widgets when selecting on Charts
- Use Ask Data
- Use Web Edit
- Export the grid in a file
- Restore grid from file
- Populate with some samples

![Screen Shot](https://raw.githubusercontent.com/aalteirac/widget-tableau-portal/master/widget.png)

## Live Instance

You can play with it here: [https://tableau-widget.alteirac.com](https://tableau-widget.alteirac.com)

## Installation

### Option 1
You can host directly the "public" folder in your web server, no backend needed, pure static web app.

### Option 2
Run the nodejs server:
- Install nodejs runtime
- Download the entire repo in zip or git clone

In the project folder, run the following:
- npm install

Run it with:
- node server.js

The server is running on port 3000, locally go to [http://localhost:3000](http://localhost:3000)
