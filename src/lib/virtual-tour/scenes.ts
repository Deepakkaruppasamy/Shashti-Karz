
export interface Hotspot {
    position: [number, number, number];
    type: "navigation" | "info" | "action";
    targetScene?: string;
    label: string;
    infoTitle?: string;
    infoBody?: string;
}

export interface Scene {
    id: string;
    name: string;
    image: string;
    hotspots: Hotspot[];
    initialRotation: [number, number, number];
    description: string;
    ambientSound?: string;
}

export const SCENES: Record<string, Scene> = {
    outside: {
        id: "outside",
        name: "Main Entrance",
        image: "https://content.jdmagicbox.com/v2/comp/tirupur/i7/9999px421.x421.250820151543.f4i7/catalogue/shashti-karz-detailingxpert-avanashi-car-repair-and-services-cz8tn2gx3p.jpg",
        initialRotation: [0, 0, 0],
        description: "Welcome to Shashti Karz. You are viewing our premium facility exterior in Tiruppur.",
        hotspots: [
            {
                position: [5, 0, -10],
                type: "navigation",
                targetScene: "workshop",
                label: "Enter Workshop",
            },
            {
                position: [-10, 2, -5],
                type: "info",
                label: "About Facility",
                infoTitle: "Xpert Detailing Center",
                infoBody: "Our facility is equipped with specialized bays for washing, detailing, and premium coatings."
            }
        ]
    },
    workshop: {
        id: "workshop",
        name: "Detailing Workshop",
        image: "https://content.jdmagicbox.com/v2/comp/tirupur/i7/9999px421.x421.250820151543.f4i7/catalogue/shashti-karz-detailingxpert-avanashi-car-repair-and-services-owh45ytg3x.jpg",
        initialRotation: [0, 0, 0],
        description: "Our main detailing bay and washing area. This is where the magic happens.",
        hotspots: [
            {
                position: [0, 0, 10],
                type: "navigation",
                targetScene: "outside",
                label: "Back to Entrance",
            },
            {
                position: [10, 0, 0],
                type: "navigation",
                targetScene: "service_bay",
                label: "Service Area",
            },
            {
                position: [-5, 1, -5],
                type: "info",
                label: "Equipment",
                infoTitle: "Industrial Washing Pit",
                infoBody: "Our advanced washing pit allows for thorough underbody cleaning and specialized maintenance."
            }
        ]
    },
    service_bay: {
        id: "service_bay",
        name: "Service & Detailing Area",
        image: "https://content.jdmagicbox.com/v2/comp/tirupur/i7/9999px421.x421.250820151543.f4i7/catalogue/shashti-karz-detailingxpert-avanashi-car-repair-and-services-tozgssaip5.jpg",
        initialRotation: [0, 0, 0],
        description: "A wide view of our service area where multiple cars receive Xpert care simultaneously.",
        hotspots: [
            {
                position: [-10, 0, 0],
                type: "navigation",
                targetScene: "workshop",
                label: "Back to Main Workshop",
            }
        ]
    },
    reception: {
        id: "reception",
        name: "Lobby & Reception",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop",
        initialRotation: [0, Math.PI / 2, 0],
        description: "Our welcome lobby. Here we host our clients and showcase our legacy of excellence.",
        hotspots: [
            {
                position: [-10, 0, 0],
                type: "navigation",
                targetScene: "outside",
                label: "Exit to Main Road",
            }
        ]
    }
};
