import fetchMock from "jest-fetch-mock";
import loadData from "./load-data"; // 


beforeAll(() => {
  fetchMock.enableMocks();
});

beforeEach(() => {
  fetchMock.resetMocks(); 
});

describe("loadData", () => {
  it("returns a Promise", async () => {
    // Mock API response
    fetchMock.mockResponseOnce(JSON.stringify({ data: "mocked response" }));

    const result = loadData(); 

    expect(result).toBeInstanceOf(Promise);

    const data = await result;
    expect(data).toEqual({ data: "mocked response" });

    // Ensure fetch was called once
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

