package com.example.upipaymentalert.db;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import com.example.upipaymentalert.model.PaymentTransaction;

import java.util.List;

@Dao
public interface TransactionDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(PaymentTransaction transaction);

    @Query("SELECT * FROM transactions ORDER BY timestamp DESC")
    List<PaymentTransaction> getAllTransactions();

    @Query("SELECT * FROM transactions WHERE timestamp >= :startTimestamp AND timestamp <= :endTimestamp ORDER BY timestamp DESC")
    List<PaymentTransaction> getTransactionsByDate(long startTimestamp, long endTimestamp);

    @Query("SELECT * FROM transactions WHERE sender = :appName ORDER BY timestamp DESC")
    List<PaymentTransaction> getTransactionsByApp(String appName);

    @Query("SELECT * FROM transactions WHERE sender = :appName AND timestamp >= :startTimestamp AND timestamp <= :endTimestamp ORDER BY timestamp DESC")
    List<PaymentTransaction> getTransactionsByAppAndDate(String appName, long startTimestamp, long endTimestamp);

    @Query("DELETE FROM transactions")
    void deleteAll();
}

