exports.list = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};
