<p align="center">
  <img src="docs/images/readme-banner.svg" alt="PastTracks — Every journey has a story. Keep yours." width="100%" />
</p>

<p align="center">
  A welcoming GPS travel journal for the morning walk, the long way home, and everywhere in between.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-149ECA?style=flat-square&amp;logo=react&amp;logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&amp;logo=typescript&amp;logoColor=white" alt="TypeScript 5.7" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&amp;logo=vite&amp;logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-0891B2?style=flat-square&amp;logo=tailwindcss&amp;logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/MapLibre-Maps-436848?style=flat-square" alt="MapLibre maps" />
  <img src="https://img.shields.io/badge/Storage-Browser_local-7C9257?style=flat-square" alt="Browser-local storage" />
</p>

<p align="center">
  <a href="https://past-tracks.vercel.app/"><strong>🌿 Open PastTracks</strong></a>
  &nbsp; · &nbsp;
  <a href="https://github.com/rajashekarakula19-spec/past-tracks">View repository</a>
</p>

---

## 🗺️ A little look around

### A welcoming first step

![PastTracks landing page with an illustrated coastal route and a Start your journey button](docs/images/landing-page.png)

The [main link](https://past-tracks.vercel.app/) opens the landing page first. Choose **Start your journey** or **Open app** when you’re ready to explore. The landing map is an illustration with sample journey statistics.

### Your world, in Garden colors

![PastTracks app with ivory recording controls, forest-green navigation, and a sage-colored map](docs/images/app-desktop.png)

**PastTracks Garden** brings ivory roads, sage parks, muted blue water, and forest-green routes to the interactive map. Matching journey cards keep distance, time, and replay a glance away.

<details>
<summary><strong>📱 See the mobile view</strong></summary>
<br />
<p align="center">
  <img src="docs/images/app-mobile.png" alt="PastTracks on mobile with Record and Journeys navigation and a large Start a journey button" width="300" />
</p>
</details>

## ✨ Made for the journey

| | What you can do |
| --- | --- |
| 📍 **Record** | Start, pause, resume, and save GPS journeys with distance in miles, speed in mph, duration, and location accuracy. |
| 🗓️ **Rediscover** | Browse trips by date, inspect saved routes, and manage your travel history. |
| 📌 **Remember a place** | Spend 5+ minutes within a roughly 650 ft-wide area to create a stop checkpoint—even while walking around. View arrival, departure, and time spent there. |
| ▶️ **Relive** | Replay journeys with adjustable speed and an interactive timeline. |
| 🎨 **Make it yours** | Switch between Garden, street, satellite, night, and city maps; toggle routes and 3D perspective. |
| 💾 **Keep a copy** | Store trips in your browser and export all journeys as JSON or a single route as GeoJSON. |
| 🧭 **Try it out** | Explore sample trips and simulated journeys before heading outside. |

## 🚀 Get started

Install **Node.js 22+** and npm, then run:

```bash
git clone https://github.com/rajashekarakula19-spec/past-tracks.git
cd past-tracks
npm ci
npm run dev
```

Open [localhost:5173](http://localhost:5173). No environment variables, API keys, or separate backend are required for the current configuration.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server on port 5173. |
| `npm test` | Check mile conversion, area visits, GPS gaps, and stationary recording. |
| `npm run build` | Run TypeScript checks and build the production app in `dist/`. |
| `npm run preview` | Preview the production build locally. |

## 🌱 Your first journey

1. Open the welcome page and choose **Start your journey**.
2. Allow location access, then select **Start a journey** in the recorder.
3. Watch your distance, time, and speed; pause or resume whenever you need.
4. Choose **Finish & save**, then find the trip under **Journeys**.
5. Open a route, tap its replay button, or use **Export all** to keep a backup.

**Finding your way around:** **Record** is your recorder, **Journeys** is your history, and the layers icon opens **Map styles**. The **More options** menu contains demo journeys, developer tools, and a link back to the welcome page. Clicking the PastTracks logo also takes you home.

The tracker loads when first opened at `/#app`. Returning to the landing page through in-page navigation preserves the app’s recording and selected journey. Sample trips are added when the trip store is empty.

## 📌 Stop checkpoints

A checkpoint is a **place visit**, not just standing still: spending **five minutes or more within 100 meters of the arrival location** (an area roughly 650 feet across) counts, including walking around a store or nearby block.

Open **Stop checkpoints** in the recorder or a saved journey’s details. Each visit shows an AM/PM arrival–departure range, time spent in the area, and a numbered marker. Select a checkpoint to center it on the map; tap its marker for the same timing details. Times use your device’s local time zone; overnight ranges include dates.

Stationary GPS observations are retained without adding tiny position changes to distance. A gap of more than two minutes between reliable readings breaks a visit, so missing GPS coverage is not counted as time at a place. Older journeys can show checkpoints when their recorded points or saved stops provide enough evidence; missing historical readings cannot be reconstructed.

Displayed travel distances use **miles**, and speeds use **mph**. Original metric fields remain in stored trips and exports for compatibility; exports also include `distanceMiles` and checkpoints.

## 🛠️ Under the hood

| Layer | Tools |
| --- | --- |
| Interface | React 19 · TypeScript · Tailwind CSS |
| Build | Vite 6 |
| Maps & geography | MapLibre GL JS · Turf.js · OpenFreeMap |
| Motion | Framer Motion · Canvas Confetti |
| Storage | IndexedDB through `idb-keyval` |

```text
src/
├── components/
│   ├── HUD/              # Recorder, history, journey cards, and demo tools
│   ├── Map/              # Interactive map and style controls
│   ├── Timeline/         # Journey replay controls
│   └── UI/               # Shared UI components
├── services/             # GPS, storage, simulation, and road snapping
├── types/                # Trip and tracking types
├── utils/                # Geographic helpers and Garden map style
├── LandingPage.tsx       # Welcome page and illustrated journey map
├── landing.css           # Landing page styles
├── app-ui.css            # App navigation, recorder, and replay styles
├── App.tsx               # Tracker state and layout
└── main.tsx              # Landing/app navigation and lazy loading
```

## 🔒 Your journeys & your browser

Trips stay in the current browser’s **IndexedDB**. They do not automatically sync across browsers or devices, and clearing site data removes them. Export journeys you want to keep.

Live tracking needs location permission and a secure context: **HTTPS** when deployed, or **localhost** during development. Keep the app open while recording; background tabs and locked screens may interrupt location updates. Screen wake lock is used where supported.

Maps and road routing require internet access. The current implementation loads map resources from Google, CARTO, and OpenFreeMap, and sends route coordinates to the public OSRM service for road snapping. Garden tiles and labels use OpenFreeMap, OpenMapTiles, and OpenStreetMap data.

## ☁️ Deployment

PastTracks is hosted on [Vercel](https://past-tracks.vercel.app/). For a static deployment, install with `npm ci`, build with `npm run build`, and publish **`dist/`**. Serve over HTTPS to enable GPS tracking.

---

<p align="center">
  <strong>🌿 Made for the journey, and the memories.</strong><br />
  <a href="https://past-tracks.vercel.app/">Your next story starts here ↗</a>
</p>
