import Product from "../models/product.model.js";
import User from "../models/user.model.js";

const getAnalytics = async (req, res) => {
  try {
    const analyticsData = await getAnalyticsData();

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days back

    const dailySalesData = await getDailySalesData(startDate, endDate);

    res.json({
      analyticsData,
      dailySalesData
    })
  } catch (error) {
    console.log("Error in getAnalytics controller", error.message);
    res.status(500).json({ error: error.message });
  }
}

const getAnalyticsData = async () => {
  try {
    const totalUser = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    const salesData = await Order.aggregate([
      {
        $group: {
          _id: null, // groups all document together
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const { totalSales, totalRevenue } = salesData[0] || {
      totalSales: 0,
      totalRevenue: 0,
    };

    return {
      users: totalUser,
      products: totalProducts,
      totalSales,
      totalRevenue,
    };
  } catch (error) {
    throw new Error("Error in getAnalyticsData controller", error.message);
  }
};

const getDailySalesData = async (startDate, endDate) => {
  try {
    // example: dailySalesData = [
    //   { "_id": "2023-10-01", "sales": 10, "revenue": 500 },
    //   { "_id": "2023-10-02", "sales": 15, "revenue": 750 },
    //   // More daily sales data...
    // ]
    const dailySalesData = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dateArray = getDatesInRange(startDate, endDate);

    return dateArray.map((date) => {
      const foundData = dailySalesData.find((data) => data._id === date);

      return {
        _id: date,
        sales: foundData ? foundData.sales : 0,
        revenue: foundData ? foundData.revenue : 0,
      };
    });
  } catch (error) {
    throw new Error("Error in getDailySalesData controller", error.message);
  }
};

const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

export { getAnalyticsData, getDailySalesData, getAnalytics };
