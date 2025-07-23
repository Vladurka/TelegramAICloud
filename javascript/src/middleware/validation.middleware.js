export const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({
      error: "Validation error",
      details: result.error.format(),
    });
  }
  console.log(result.data);
  req.body = result.data;
  next();
};
