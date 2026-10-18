CXX ?= g++
CXXFLAGS = -std=c++14 -O3 -Wall -Wextra

TARGET = engine/graph_tracer
ifeq ($(OS),Windows_NT)
    TARGET := $(TARGET).exe
endif

SRC = engine/graph_tracer.cpp

all: $(TARGET)

$(TARGET): $(SRC)
	$(CXX) $(CXXFLAGS) $(SRC) -o $(TARGET)

clean:
	rm -f engine/graph_tracer engine/graph_tracer.exe
