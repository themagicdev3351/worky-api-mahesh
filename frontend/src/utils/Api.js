import { config } from "./config";
import { getTokenLocalStorage } from "./localstorage";

const getRequest = async (path) => {
  // console.log(getTokenLocalStorage())
  try {
    const params = {
      method: "GET",
      headers: {
        Authorization: "Bearer " + getTokenLocalStorage(),
      },
    };
    const res = await fetch(config.env.baseURL + path, params);
    const data = await res.text();
    return { statusCode: res.status, data };
  } catch (e) {
    console.error(`error in get Request (${path}) :- `, e);
    return { statusCode: 400, data: [] };
  }
};

const postRequest = async (path, body) => {
  try {
    const params = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getTokenLocalStorage(),
      },
      body: JSON.stringify(body),
    };

    const res = await fetch(config.env.baseURL + path, params);
    // console.log(res)

    const data = await res.text();
    // console.log({data})
    return { statusCode: res.status, data };
  } catch (e) {
    console.log(`error in post Request (${path}) :- `, e);
  }
};

const DeleteRequest = async (path) => {
  try {
    const params = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getTokenLocalStorage(),
      },
    };

    const res = await fetch(config.env.baseURL + path, params);

    const data = await res.text();
    return { statusCode: res.status, data };
  } catch (e) {
    console.log(`error in Delete Request (${path}) :- `, e);
  }
};

const putRequest = async (path, body) => {
  try {
    const params = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getTokenLocalStorage(),
      },
      body: JSON.stringify(body),
    };

    const res = await fetch(config.env.baseURL + path, params);

    const data = await res.text();
    return { statusCode: res.status, data };
  } catch (e) {
    console.log(`error in PUT Request (${path}) :- `, e);
  }
};

export const Api = {
  getRequest,
  postRequest,
  DeleteRequest,
  putRequest,
};
