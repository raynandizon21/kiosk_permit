import bcrypt from "bcrypt";
import * as authModel from "../models/authModel.js";
import { getErrorMessage } from "../utils/helpers.js";

export async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await authModel.findUserByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.PASSWORD))) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    res.json({
      id: user.IDNo,
      username: user.USERNAME,
      fullname: `${user.FIRST_NAME} ${user.LAST_NAME}`.trim(),
      position: user.POSITION || "",
    });
  } catch (error) {
    console.error("Login error:", getErrorMessage(error));
    res.status(500).json({ error: "Database connection failed. Check MYSQL_* in .env" });
  }
}
