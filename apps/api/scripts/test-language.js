const API_URL = process.env.API_URL ?? "http://localhost:4000";
async function ask(question, language) {
    const res = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, language })
    });
    if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
    }
    return (await res.json());
}
async function main() {
    const en = await ask("I can't see apps after assigning a role", "en");
    const es = await ask("Asigné un rol pero no veo apps", "es");
    if (!/verify|check|confirm|based on/i.test(en.answer)) {
        throw new Error("Expected English answer in en response.");
    }
    if (!/verifica|revisa|según|empieza/i.test(es.answer)) {
        throw new Error("Expected Spanish answer in es response.");
    }
    if (/If a user can log in/i.test(es.answer)) {
        throw new Error("Unexpected English phrase in es answer.");
    }
    console.log("Language checks passed.");
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
export {};
