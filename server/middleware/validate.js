function validationErrorToMessage(err) {
    if (!err || !err.issues) return 'Dados inválidos.';
    // Return first issue message (keep responses small)
    const first = err.issues[0];
    return first?.message || 'Dados inválidos.';
}

function validateBody(schema) {
    return (req, res, next) => {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: validationErrorToMessage(parsed.error) });
        }
        req.body = parsed.data;
        return next();
    };
}

function validateQuery(schema) {
    return (req, res, next) => {
        const parsed = schema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({ error: validationErrorToMessage(parsed.error) });
        }
        req.query = parsed.data;
        return next();
    };
}

function validateParams(schema) {
    return (req, res, next) => {
        const parsed = schema.safeParse(req.params);
        if (!parsed.success) {
            return res.status(400).json({ error: validationErrorToMessage(parsed.error) });
        }
        req.params = parsed.data;
        return next();
    };
}

module.exports = {
    validateBody,
    validateQuery,
    validateParams
};
