if (allCompanies.length === 0) {
    console.log("No companies found.");
} else {
    console.table(allCompanies.map(c => ({
        id: c.id,
        name: c.name,
        industry: c.industry,
        website: c.website
    })));
}
console.log("----------------------------\n");
process.exit(0);
    } catch (error) {
    console.error("Error listing companies:", error);
    process.exit(1);
}
}

main();
