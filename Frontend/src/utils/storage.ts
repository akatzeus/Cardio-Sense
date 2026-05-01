// utils/storage.ts
export const storage = {
  getToken: () => sessionStorage.getItem("access_token"),
  setToken: (token: string) => sessionStorage.setItem("access_token", token),
  removeToken: () => sessionStorage.removeItem("access_token"),
  
  getUser: () => {
    const user = sessionStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },
  setUser: (user: any) => sessionStorage.setItem("user", JSON.stringify(user)),
  
  getUserId: () => {
    const id = sessionStorage.getItem("user_id");
    return id ? Number(id) : null;
  },
  setUserId: (id: number) => sessionStorage.setItem("user_id", id.toString()),
  
  clear: () => sessionStorage.clear(),
};