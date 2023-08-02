import express from "express";
import * as domain from "./domain";

const router = express.Router();

// Create a new organisation
router.post("/organisations", async (req, res) => {
  const organisation = await domain.createOrganisation(req.body);
  res.json(organisation);
});

// Get a specific organisation by ID
router.get("/organisations/:id", async (req, res, next) => {
  console.log("in here", req.params.id);
  const organisation = await domain.getOrganisationById(req.params.id);
  if (organisation) {
    res.json(organisation);
  } else {
    next();
  }
});

// Get all organisations
router.get("/organisations", async (req, res) => {
  const organisations = await domain.getOrganisations();
  res.json(organisations);
});

// Update an organisation
router.put("/organisations/:id", async (req, res, next) => {
  const updatedOrganisation = await domain.updateOrganisation(
    req.params.id,
    req.body
  );
  if (updatedOrganisation) {
    res.json(updatedOrganisation);
  } else {
    next();
  }
});

export default router;
